import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { filesUnder } from "./lib.mjs";

const sourceFiles = (await filesUnder(".")).filter(
  (path) =>
    !path.startsWith("node_modules/") &&
    !path.startsWith(".git/") &&
    !path.startsWith("build/") &&
    !path.startsWith("dist/") &&
    /\.(?:css|html|js|json|mjs|webmanifest)$/.test(path),
);
const runtimeFiles = sourceFiles.filter(
  (path) =>
    /^(?:src|templates|assets|localization)\//.test(path) &&
    !path.startsWith("assets/fonts/"),
);
const remoteReference = /(?:src|href|url\(|@import\s+)[^\n]*https?:\/\//i;
const findings = [];

for (const path of runtimeFiles) {
  const content = await readFile(path, "utf8");
  if (remoteReference.test(content)) findings.push(path);
}

if (findings.length) {
  throw new Error(
    `Remote runtime asset reference found in: ${findings.join(", ")}`,
  );
}

const prohibitedBinary = /\.(?:woff2?|ttf|otf|png|jpe?g|webp|ico|zip|tar|gz)$/i;
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const trackedBinary = tracked.filter((path) => prohibitedBinary.test(path));
if (trackedBinary.length) {
  throw new Error(
    `Prohibited binary artifact tracked by Git: ${trackedBinary.join(", ")}`,
  );
}

console.log(
  `Validated ${runtimeFiles.length} runtime source files: no remote assets or tracked binary artifacts.`,
);
