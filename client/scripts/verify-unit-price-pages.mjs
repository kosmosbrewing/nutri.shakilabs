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

for (const category of dataset.categories) {
  const path = resolve(distRoot, `${category.slug}.html`);
  assert(existsSync(path), `Missing unit price page: ${category.slug}`);
  const html = readFileSync(path, "utf8");
  assert(html.includes(`data-unit-price-section="${category.slug}"`), `${category.slug}: missing comparison section`);
  assert((html.match(/data-unit-price-card=/g) ?? []).length === 3, `${category.slug}: expected 3 price cards`);
  assert((html.match(/data-price-efficiency-score=/g) ?? []).length === 3, `${category.slug}: expected 3 efficiency scores`);
  assert((html.match(/data-unit-price-source="official"/g) ?? []).length === 3, `${category.slug}: missing official links`);
  assert((html.match(/data-unit-price-source="price"/g) ?? []).length === 3, `${category.slug}: missing price links`);
  assert(html.includes("가격효율지수"), `${category.slug}: missing efficiency label`);
  assert(html.includes("낮은 단위가격은 구매 판단의 한 요소"), `${category.slug}: missing interpretation warning`);
  assert(html.includes("unit-price-v1"), `${category.slug}: missing score version`);
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
assert((sourcesHtml.match(/data-unit-price-evidence-card/g) ?? []).length === 27, "Sources must list 27 unit-price products");

process.stdout.write("Verified 9 price-efficiency pages, 27 cards, methodology, sources, and category boundaries.\n");
