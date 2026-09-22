import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, join } from "node:path";

export const manifestPath = "assets/fonts/inter-4.1.json";

function digest(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function download(url, temporary) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (fetchError) {
    // Node 20 fetch does not honor HTTPS_PROXY. Curl is a fallback for proxied
    // build environments; direct environments keep the dependency-free path.
    const transportFile = `${temporary}.transport`;
    await rm(transportFile, { force: true });
    const result = spawnSync(
      "curl",
      [
        "--fail",
        "--location",
        "--silent",
        "--show-error",
        "--max-time",
        "30",
        "--output",
        transportFile,
        url,
      ],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      await rm(transportFile, { force: true });
      throw new Error(
        `Font download failed with fetch and curl: ${url}\n${fetchError.message}\n${result.stderr || "curl unavailable"}`,
        { cause: fetchError },
      );
    }
    const content = await readFile(transportFile);
    await rm(transportFile, { force: true });
    return content;
  }
}

export async function verifyFontFile(path, expected) {
  try {
    return digest(await readFile(path)) === expected;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function acquireFonts() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const cache = join("build", "cache", "fonts", `inter-${manifest.version}`);
  await mkdir(cache, { recursive: true });

  for (const font of manifest.files) {
    if (basename(font.url) !== font.name) {
      throw new Error(
        `Pinned font URL does not match expected file: ${font.name}`,
      );
    }

    const destination = join(cache, font.name);
    try {
      await access(destination);
      if (!(await verifyFontFile(destination, font.sha256))) {
        throw new Error(`Cached font checksum mismatch: ${font.name}`);
      }
      console.log(`Verified cached Inter ${manifest.version}: ${font.name}`);
      continue;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const temporary = `${destination}.download`;
    await rm(temporary, { force: true });
    console.log(`Downloading Inter ${manifest.version}: ${font.url}`);
    const content = await download(font.url, temporary);
    const actual = digest(content);
    if (actual !== font.sha256) {
      throw new Error(
        `Downloaded font checksum mismatch for ${font.name}: expected ${font.sha256}, received ${actual}`,
      );
    }

    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, destination);
    console.log(`Downloaded and verified: ${font.name}`);
  }

  return { cache, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await acquireFonts();
}
