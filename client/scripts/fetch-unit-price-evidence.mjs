import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFoodSafetyPortalSession,
  fetchFoodSafetyProductDetail,
  foodSafetyPortalSourceUrl,
} from "./food-safety-portal.mjs";
import { evidenceTargetsSchema, unitPriceEvidenceSchema } from "./unit-price-evidence.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const evidenceRoot = resolve(scriptDir, "../../data/evidence");
const targetsPath = resolve(evidenceRoot, "unit-price-portal-targets.json");
const outputPath = resolve(evidenceRoot, "unit-price-food-safety.json");
const targetsInput = JSON.parse(await readFile(targetsPath, "utf8"));
const targetsResult = evidenceTargetsSchema.safeParse(targetsInput);
if (!targetsResult.success) throw new Error("Unit-price evidence targets are invalid");

const session = await createFoodSafetyPortalSession();
const products = [];
for (const target of targetsResult.data.targets) {
  const detail = await fetchFoodSafetyProductDetail(session, target.ledgerNo);
  if (detail.reportNo !== target.reportNo) {
    throw new Error(`FoodSafety report mismatch: ${target.productId}`);
  }
  products.push({ ...target, ...detail });
  process.stdout.write(`Fetched official evidence: ${target.productId}\n`);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
}

const checkedAt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const evidence = unitPriceEvidenceSchema.parse({
  schemaVersion: "unit-price-evidence-v1",
  checkedAt,
  sourceUrl: foodSafetyPortalSourceUrl,
  products,
});
await mkdir(evidenceRoot, { recursive: true });
const temporaryPath = resolve(evidenceRoot, `.unit-price-food-safety-${Date.now()}.json`);
await writeFile(temporaryPath, `${JSON.stringify(evidence)}\n`, "utf8");
await rename(temporaryPath, outputPath);
process.stdout.write(`Saved ${products.length} official unit-price evidence records.\n`);
