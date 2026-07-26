import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseJsonResponse } from "./public-data-schema.mjs";
import { unitPriceDatasetSchema } from "./unit-price-schema.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist/categories");
const input = JSON.parse(readFileSync(resolve(clientRoot, "src/data/unit-price-products.json"), "utf8"));
const dataset = parseJsonResponse(unitPriceDatasetSchema, input, "Unit price dataset");
const comparisonSlugs = new Set(dataset.categories.map(({ slug }) => slug));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const RANKING_MIN_PRODUCTS = 4;
let totalCards = 0;
for (const category of dataset.categories) {
  const path = resolve(distRoot, `${category.slug}.html`);
  assert(existsSync(path), `Missing unit price page: ${category.slug}`);
  const html = readFileSync(path, "utf8");
  const expected = category.products.length;
  totalCards += expected;
  assert(html.includes(`data-unit-price-section="${category.slug}"`), `${category.slug}: missing comparison section`);
  assert((html.match(/data-unit-price-card=/g) ?? []).length === expected, `${category.slug}: expected ${expected} price cards`);
  assert((html.match(/data-price-efficiency-score=/g) ?? []).length === expected, `${category.slug}: expected ${expected} efficiency scores`);
  assert((html.match(/data-unit-price-source="official"/g) ?? []).length === expected, `${category.slug}: missing official links`);
  assert((html.match(/data-unit-price-source="price"/g) ?? []).length === expected, `${category.slug}: missing price links`);
  assert(html.includes("가격효율지수"), `${category.slug}: missing efficiency label`);
  assert(html.includes("낮은 단위가격은 구매 판단의 한 요소"), `${category.slug}: missing interpretation warning`);
  assert(html.includes("unit-price-v1"), `${category.slug}: missing score version`);
  // 순위 표기는 비교군 4개 이상에서만 — 표기 시 반드시 정량·비효능 고지 동반
  if (expected >= RANKING_MIN_PRODUCTS) {
    assert(html.includes(`가격효율 순위 TOP ${expected}`), `${category.slug}: missing ranking heading`);
    assert(html.includes("효능·품질 순위가 아닙니다"), `${category.slug}: missing ranking disclaimer`);
  } else {
    assert(!html.includes("가격효율 순위 TOP"), `${category.slug}: ranking heading not allowed under ${RANKING_MIN_PRODUCTS} products`);
  }
}

const catalog = JSON.parse(readFileSync(resolve(clientRoot, "src/data/category-catalog.json"), "utf8"));
for (const category of catalog.categories) {
  const html = readFileSync(resolve(distRoot, `${category.slug}.html`), "utf8");
  if (!comparisonSlugs.has(category.slug)) {
    assert(!html.includes("data-unit-price-section"), `${category.slug}: unexpected comparison section`);
    assert(html.includes("순위가 아닙니다"), `${category.slug}: missing non-ranking disclosure`);
  }
}

const methodologyHtml = readFileSync(resolve(clientRoot, "dist/methodology.html"), "utf8");
assert(methodologyHtml.includes("data-unit-price-method"), "Methodology must explain unit-price-v1");
assert(methodologyHtml.includes("data-category-value-method"), "Methodology must explain category-value-v1");
assert(methodologyHtml.includes("현재 비교군 최저 단위가격"), "Methodology must publish the efficiency formula");
for (const category of dataset.categories) {
  assert(methodologyHtml.includes(category.basisLabel), `Methodology must include ${category.slug} basis`);
}
const sourcesHtml = readFileSync(resolve(clientRoot, "dist/sources.html"), "utf8");
assert(
  (sourcesHtml.match(/data-unit-price-evidence-card/g) ?? []).length === totalCards,
  `Sources must list ${totalCards} unit-price products`,
);

process.stdout.write(`Verified 9 price-efficiency pages, ${totalCards} cards, methodology, sources, and category boundaries.\n`);
