import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptDir, "..");
const rawRoot = resolve(clientRoot, "../data/raw");
const nodeBin = process.execPath;
const vitestBin = resolve(clientRoot, "node_modules/vitest/vitest.mjs");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: clientRoot, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (existsSync(rawRoot)) {
  run(nodeBin, [resolve(scriptDir, "verify-public-data.mjs")]);
} else {
  process.stdout.write("Raw snapshot not present; skipping local raw verification.\n");
}

run(nodeBin, [vitestBin, "run", "src/utils/dataset.test.ts"]);
