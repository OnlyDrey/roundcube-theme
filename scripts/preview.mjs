import { spawn, spawnSync } from "node:child_process";

const build = spawnSync(
  process.execPath,
  ["scripts/build.mjs", "--development"],
  {
    stdio: "inherit",
  },
);

if (build.status !== 0) process.exit(build.status ?? 1);

const port = process.env.PORT ?? "4173";
const server = spawn(
  process.env.PYTHON ?? "python3",
  ["-m", "http.server", port],
  { stdio: "inherit" },
);

server.on("error", (error) => {
  console.error(`Unable to start preview server: ${error.message}`);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

console.log(`Akio preview: http://localhost:${port}/preview/`);
