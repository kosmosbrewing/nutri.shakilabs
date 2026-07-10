import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categoryCatalogSchema } from "./category-catalog-schema.mjs";
import { manifestSchema, parseJsonResponse } from "./public-data-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const manifest = parseJsonResponse(
  manifestSchema,
  await readJson(resolve(dataRoot, "manifests/latest.json")),
  "Manifest",
);
const catalog = parseJsonResponse(
  categoryCatalogSchema,
  await readJson(resolve(scriptDir, "../src/data/category-catalog.json")),
  "Category catalog",
);
if (catalog.source.sha256 !== manifest.sha256) throw new Error("Catalog source hash is stale");
if (catalog.source.dataReferenceDate !== manifest.dataReferenceDate) {
  throw new Error("Catalog reference date is stale");
}
const slugs = new Set(catalog.categories.map((category) => category.slug));
if (slugs.size !== catalog.categories.length) throw new Error("Category slugs must be unique");
process.stdout.write(`Verified ${catalog.categories.length} categories and 54 official record samples.\n`);
