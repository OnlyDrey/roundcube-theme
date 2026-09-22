import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

export async function copy(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

export function run(command, args, environment = {}) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(join("node_modules", ".bin", executable), args, {
    env: { ...process.env, ...environment },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} exited with status ${result.status ?? "unknown"}`,
    );
  }
}

export async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const paths = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await filesUnder(path)));
    } else {
      paths.push(path);
    }
  }

  return paths;
}

export async function writeChecksums(root) {
  const paths = (await filesUnder(root)).filter(
    (path) => !path.endsWith("SHA256SUMS"),
  );
  const lines = [];

  for (const path of paths) {
    const digest = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
    lines.push(`${digest}  ${relative(root, path).replaceAll("\\", "/")}`);
  }

  await writeFile(join(root, "SHA256SUMS"), `${lines.join("\n")}\n`);
}
