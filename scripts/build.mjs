import { existsSync, watch } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { copy, run, writeChecksums } from "./lib.mjs";
import { acquireFonts } from "./acquire-fonts.mjs";

const production = process.argv.includes("--production");
const watching = process.argv.includes("--watch");
const outputRoot = production ? "dist/akio" : "build/dev/akio";
let building = false;
let pending = false;

async function build() {
  if (building) {
    pending = true;
    return;
  }

  building = true;
  await rm(outputRoot, { force: true, recursive: true });
  await mkdir(outputRoot, { recursive: true });
  const fonts = await acquireFonts();

  for (const file of [
    "composer.json",
    "meta.json",
    "LICENSE",
    "README.md",
    "THIRD_PARTY_NOTICES.md",
  ]) {
    await copy(file, join(outputRoot, file));
  }

  for (const directory of [
    "templates",
    "localization",
    "licenses",
    "docs",
    "assets/images",
  ]) {
    const destination = directory === "assets/images" ? "images" : directory;
    await copy(directory, join(outputRoot, destination));
  }

  await copy(
    "assets/manifest.webmanifest",
    join(outputRoot, "manifest.webmanifest"),
  );

  for (const font of fonts.manifest.files) {
    await copy(
      join(fonts.cache, font.name),
      join(outputRoot, "fonts", font.name),
    );
  }

  const iconNames = JSON.parse(await readFile("src/icons/icons.json", "utf8"));
  for (const name of iconNames) {
    const source = join("node_modules/lucide-static/icons", `${name}.svg`);
    if (!existsSync(source)) {
      throw new Error(`Selected Lucide icon does not exist: ${name}`);
    }
    await copy(source, join(outputRoot, "images/icons", `${name}.svg`));
  }

  run(
    "tailwindcss",
    [
      "-c",
      "tailwind.config.js",
      "-i",
      "src/styles/akio.css",
      "-o",
      join(outputRoot, "styles/akio.css"),
      ...(production ? ["--minify"] : []),
    ],
    { NODE_ENV: production ? "production" : "development" },
  );

  run("tailwindcss", [
    "-c",
    "tailwind.config.js",
    "-i",
    "src/styles/embed.css",
    "-o",
    join(outputRoot, "styles/embed.css"),
    ...(production ? ["--minify"] : []),
  ]);

  run("esbuild", [
    "src/js/theme.js",
    "--bundle",
    "--format=iife",
    `--outfile=${join(outputRoot, "scripts/theme.js")}`,
    ...(production ? ["--minify", "--legal-comments=none"] : []),
  ]);

  if (production) {
    await writeChecksums(outputRoot);
  }
  console.log(`Built ${outputRoot}`);
  building = false;

  if (pending) {
    pending = false;
    await build();
  }
}

await build();

if (watching) {
  const watchers = [
    "assets",
    "localization",
    "src",
    "templates",
    "composer.json",
    "meta.json",
    "tailwind.config.js",
  ].map((path) => watch(path, { recursive: true }, () => void build()));

  const close = () => {
    for (const watcher of watchers) watcher.close();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
  console.log("Watching Phase 1 sources. Press Ctrl+C to stop.");
}
