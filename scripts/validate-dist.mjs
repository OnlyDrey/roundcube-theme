import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { filesUnder } from "./lib.mjs";

const root = process.argv[2] ?? "dist/akio";
const required = [
  "meta.json",
  "composer.json",
  "templates/includes/layout.html",
  "styles/akio.css",
  "styles/embed.css",
  "scripts/theme.js",
  "fonts/InterVariable.woff2",
  "fonts/InterVariable-Italic.woff2",
  "images/logo.svg",
  "images/favicon.svg",
  "manifest.webmanifest",
  "LICENSE",
  "SHA256SUMS",
];

for (const path of required) await access(join(root, path));

const fontManifest = JSON.parse(
  await readFile("assets/fonts/inter-4.1.json", "utf8"),
);
for (const font of fontManifest.files) {
  const content = await readFile(join(root, "fonts", font.name));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== font.sha256) {
    throw new Error(`Packaged font checksum mismatch: ${font.name}`);
  }
}

const metadata = JSON.parse(await readFile(join(root, "meta.json"), "utf8"));
if (metadata.extends !== "elastic") throw new Error("Skin must extend Elastic");
if (metadata.config?.dark_mode_support !== true) {
  throw new Error("Skin metadata must enable dark mode support");
}

const files = await filesUnder(root);
const forbidden = files.filter((path) =>
  /(?:\.map|\.env|\.pem|\.key|package-lock\.json|node_modules)/i.test(path),
);
if (forbidden.length) {
  throw new Error(
    `Development or secret artifact in dist: ${forbidden.join(", ")}`,
  );
}

const inspectable = files.filter((path) =>
  /\.(?:css|html|js|webmanifest)$/.test(path),
);
const remoteReference = /(?:src|href|url\(|@import\s+)[^\n]*https?:\/\//i;
for (const path of inspectable) {
  if (remoteReference.test(await readFile(path, "utf8"))) {
    throw new Error(
      `Remote runtime asset reference in ${relative(root, path)}`,
    );
  }
}

console.log(
  `Validated installable skin at ${root}: ${files.length} files, no remote assets or development artifacts.`,
);
