import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unitPriceDatasetSchema } from "./unit-price-schema.mjs";
import {
  extractOfficialActiveAmount,
  extractOfficialUnitsPerDay,
  unitPriceEvidenceSchema,
} from "./unit-price-evidence.mjs";
import { categoryOfferFileSchema } from "./unit-price-offer-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptDir, "..");
const evidenceRoot = resolve(clientRoot, "../data/evidence");
const datasetPath = resolve(clientRoot, "src/data/unit-price-products.json");
const expansionSlugs = ["probiotics", "omega-3", "magnesium", "msm", "coenzyme-q10", "milk-thistle"];
const categoryOrder = [
  "vitamin-d", "probiotics", "vitamin-c", "omega-3", "magnesium",
  "calcium", "msm", "coenzyme-q10", "milk-thistle",
];
const definitions = {
  probiotics: ["프로바이오틱스", "프로바이오틱스", "cfu", 1_000_000_000, "프로바이오틱스 10억 CFU당", "공식 1일 보장균수를 10억 CFU 기준으로 맞춘 가격 비교"],
  "omega-3": ["오메가3", "EPA+DHA", "mg", 100, "EPA+DHA 100 mg당", "공식 1일 EPA와 DHA 합을 100 mg 기준으로 맞춘 가격 비교"],
  magnesium: ["마그네슘", "마그네슘", "mg", 100, "마그네슘 100 mg당", "공식 1일 마그네슘 함량을 100 mg 기준으로 맞춘 가격 비교"],
  msm: ["MSM", "MSM", "mg", 1_000, "MSM 1,000 mg당", "공식 1일 MSM 함량을 1,000 mg 기준으로 맞춘 가격 비교"],
  "coenzyme-q10": ["코엔자임Q10", "코엔자임Q10", "mg", 100, "코엔자임Q10 100 mg당", "공식 1일 코엔자임Q10 함량을 100 mg 기준으로 맞춘 가격 비교"],
  "milk-thistle": ["밀크씨슬", "실리마린", "mg", 100, "실리마린 100 mg당", "공식 1일 실리마린 함량을 100 mg 기준으로 맞춘 가격 비교"],
};

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const current = await readJson(datasetPath);
const evidence = unitPriceEvidenceSchema.parse(await readJson(resolve(evidenceRoot, "unit-price-food-safety.json")));
const evidenceById = new Map(evidence.products.map((product) => [product.productId, product]));
const generated = new Map();

for (const slug of expansionSlugs) {
  const input = categoryOfferFileSchema.parse(await readJson(resolve(evidenceRoot, `unit-price-offers/${slug}.json`)));
  if (input.categorySlug !== slug) throw new Error(`Offer category mismatch: ${slug}`);
  const [name, activeName, activeUnit, basisAmount, basisLabel, summary] = definitions[slug];
  const products = input.products.map((offerInput) => {
    const official = evidenceById.get(offerInput.productId);
    if (!official || official.categorySlug !== slug) throw new Error(`Missing official evidence: ${offerInput.productId}`);
    const dailyActiveAmount = extractOfficialActiveAmount(slug, official.standardText);
    const officialUnitsPerDay = extractOfficialUnitsPerDay(official.intakeText);
    if (dailyActiveAmount === null) throw new Error(`Missing official amount: ${offerInput.productId}`);
    if (officialUnitsPerDay !== offerInput.unitsPerDay) throw new Error(`Official serving mismatch: ${offerInput.productId}`);
    if (offerInput.offer.capturedAt !== evidence.checkedAt) throw new Error(`Stale offer date: ${offerInput.productId}`);
    return {
      id: offerInput.productId,
      categorySlug: slug,
      officialName: official.officialName,
      displayName: offerInput.displayName,
      brand: offerInput.brand,
      manufacturer: official.manufacturer,
      reportNo: official.reportNo,
      officialSourceUrl: evidence.sourceUrl,
      servingLabel: offerInput.servingLabel,
      packageLabel: offerInput.packageLabel,
      dailyActiveAmount,
      activeUnit,
      totalUnitsPerPackage: offerInput.totalUnitsPerPackage,
      unitsPerDay: offerInput.unitsPerDay,
      confidence: offerInput.confidence,
      offer: offerInput.offer,
    };
  });
  generated.set(slug, { slug, name, activeName, activeUnit, basisAmount, basisLabel, summary, products });
}

const existing = new Map(current.categories.map((category) => [category.slug, {
  ...category,
  products: category.products.map((product) => ({
    ...product,
    officialSourceUrl: product.officialSourceUrl ?? current.source.url,
  })),
}]));
const categories = categoryOrder.map((slug) => generated.get(slug) ?? existing.get(slug));
if (categories.some((category) => !category)) throw new Error("A unit-price category is missing");
const output = unitPriceDatasetSchema.parse({ ...current, updatedAt: evidence.checkedAt, categories });
const temporaryPath = `${datasetPath}.${Date.now()}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(output)}\n`, "utf8");
await rename(temporaryPath, datasetPath);
process.stdout.write(`Built ${output.categories.length} categories and ${output.categories.length * 3} offers.\n`);
