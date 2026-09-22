import { rm } from "node:fs/promises";

await Promise.all([
  rm("build/dev", { force: true, recursive: true }),
  rm("dist", { force: true, recursive: true }),
]);
