import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  manifestSchema,
  parseJsonResponse,
  rawSnapshotSchema,
} from "./public-data-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");

async function readValidatedJson(path, schema, label) {
  const contents = await readFile(path, "utf8");
  let input;
  try {
    input = JSON.parse(contents);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  return { contents, data: parseJsonResponse(schema, input, label) };
}

const { data: manifest } = await readValidatedJson(
  resolve(dataRoot, "manifests/latest.json"),
  manifestSchema,
  "Manifest",
);
const { contents, data: snapshot } = await readValidatedJson(
  resolve(dataRoot, manifest.rawFile),
  rawSnapshotSchema,
  "Raw snapshot",
);
const sha256 = createHash("sha256").update(contents).digest("hex");

if (sha256 !== manifest.sha256) throw new Error("Raw snapshot hash mismatch");
if (snapshot.records.length !== manifest.rowCount) throw new Error("Raw snapshot row count mismatch");
if (snapshot.fields.length !== manifest.columnCount) throw new Error("Raw snapshot column count mismatch");

process.stdout.write(
  `Verified ${manifest.rowCount} rows, ${manifest.columnCount} columns, SHA-256 ${sha256.slice(0, 12)}.\n`,
);
