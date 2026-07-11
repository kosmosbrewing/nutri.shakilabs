import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { manifestSchema, parseJsonResponse, rawSnapshotSchema } from "./public-data-schema.mjs";
import {
  extractOfficialActiveAmount,
  extractOfficialUnitsPerDay,
  unitPriceEvidenceSchema,
} from "./unit-price-evidence.mjs";
import { unitPriceDatasetSchema } from "./unit-price-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");
const datasetPath = resolve(scriptDir, "../src/data/unit-price-products.json");
const evidencePath = resolve(dataRoot, "evidence/unit-price-food-safety.json");

async function readJson(path, schema, label) {
  const input = JSON.parse(await readFile(path, "utf8"));
  return parseJsonResponse(schema, input, label);
}

const manifest = await readJson(resolve(dataRoot, "manifests/latest.json"), manifestSchema, "Manifest");
const dataset = await readJson(datasetPath, unitPriceDatasetSchema, "Unit price dataset");
const evidence = await readJson(evidencePath, unitPriceEvidenceSchema, "Unit price official evidence");
if (dataset.source.sha256 !== manifest.sha256) throw new Error("Unit price source hash is stale");
if (dataset.source.dataReferenceDate !== manifest.dataReferenceDate) {
  throw new Error("Unit price source date is stale");
}

const products = dataset.categories.flatMap((category) => category.products);
if (dataset.updatedAt !== evidence.checkedAt) throw new Error("Official evidence date is stale");
for (const field of ["id", "reportNo"]) {
  if (new Set(products.map((product) => product[field])).size !== products.length) {
    throw new Error(`Duplicate unit price product ${field}`);
  }
}
if (products.some((product) => product.offer.capturedAt !== dataset.updatedAt)) {
  throw new Error("Every offer must be verified on the dataset update date");
}
if (products.some((product) => product.offer.affiliate || product.offer.availability !== "in_stock")) {
  throw new Error("Only current non-affiliate offers may be ranked");
}

const evidenceById = new Map(evidence.products.map((product) => [product.productId, product]));
const evidenceProducts = products.filter((product) => evidenceById.has(product.id));
if (evidenceProducts.length !== evidence.products.length) throw new Error("Official evidence coverage mismatch");
for (const product of evidenceProducts) {
  const official = evidenceById.get(product.id);
  const identityMatches = official.reportNo === product.reportNo
    && official.officialName === product.officialName
    && official.manufacturer === product.manufacturer;
  if (!identityMatches) throw new Error(`Official identity mismatch: ${product.id}`);
  if (product.officialSourceUrl !== evidence.sourceUrl) throw new Error(`Official link mismatch: ${product.id}`);
  if (extractOfficialActiveAmount(product.categorySlug, official.standardText) !== product.dailyActiveAmount) {
    throw new Error(`Official amount mismatch: ${product.id}`);
  }
  if (extractOfficialUnitsPerDay(official.intakeText) !== product.unitsPerDay) {
    throw new Error(`Official serving mismatch: ${product.id}`);
  }
}

const rawPath = resolve(dataRoot, manifest.rawFile);
if (existsSync(rawPath)) {
  const snapshot = await readJson(rawPath, rawSnapshotSchema, "Raw snapshot");
  const nutrientField = { "vitamin-d": "VITD", "vitamin-c": "VITC", calcium: "CA" };
  const snapshotProducts = products.filter((product) => nutrientField[product.categorySlug]);
  for (const product of snapshotProducts) {
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
  process.stdout.write(`Matched ${snapshotProducts.length} products to the local official snapshot.\n`);
}

process.stdout.write(`Verified ${dataset.categories.length} unit-price categories, ${products.length} offers, and ${evidenceProducts.length} FoodSafety records.\n`);
