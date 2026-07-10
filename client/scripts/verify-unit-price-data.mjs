import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { manifestSchema, parseJsonResponse, rawSnapshotSchema } from "./public-data-schema.mjs";
import { unitPriceDatasetSchema } from "./unit-price-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");
const datasetPath = resolve(scriptDir, "../src/data/unit-price-products.json");

async function readJson(path, schema, label) {
  const input = JSON.parse(await readFile(path, "utf8"));
  return parseJsonResponse(schema, input, label);
}

const manifest = await readJson(resolve(dataRoot, "manifests/latest.json"), manifestSchema, "Manifest");
const dataset = await readJson(datasetPath, unitPriceDatasetSchema, "Unit price dataset");
if (dataset.source.sha256 !== manifest.sha256) throw new Error("Unit price source hash is stale");
if (dataset.source.dataReferenceDate !== manifest.dataReferenceDate) {
  throw new Error("Unit price source date is stale");
}

const products = dataset.categories.flatMap((category) => category.products);
for (const field of ["id", "reportNo"]) {
  if (new Set(products.map((product) => product[field])).size !== products.length) {
    throw new Error(`Duplicate unit price product ${field}`);
  }
}
if (products.some((product) => product.offer.capturedAt !== dataset.updatedAt)) {
  throw new Error("Every offer must be verified on the dataset update date");
}

const rawPath = resolve(dataRoot, manifest.rawFile);
if (existsSync(rawPath)) {
  const snapshot = await readJson(rawPath, rawSnapshotSchema, "Raw snapshot");
  const nutrientField = { "vitamin-d": "VITD", "vitamin-c": "VITC", calcium: "CA" };
  for (const product of products) {
    const rows = snapshot.records.filter((row) => (
      row.ITEM_MNFTR_RPT_NO === product.reportNo && row.FOOD_NM === product.officialName
    ));
    const field = nutrientField[product.categorySlug];
    const matched = rows.some((row) => {
      const frequency = Number.parseInt(String(row.ONETM_INTK_NMTM), 10);
      return Number(row[field]) * frequency === product.dailyActiveAmount;
    });
    if (!matched) throw new Error(`Official amount mismatch: ${product.id}`);
  }
  process.stdout.write(`Matched ${products.length} products to the local official snapshot.\n`);
}

process.stdout.write("Verified 3 unit-price categories and 9 current offers.\n");
