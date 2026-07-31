// C003(품목제조신고) 벌크 스냅샷을 등록부와 신고번호로 조인해 기준규격 증거를 만든다.
// 선행: KR_FOOD_DAT=<키> npm run fetch:food-safety  (data/raw/food-safety-C003-*.json 생성)
// 포털 스크래핑(fetch-registry-specs.mjs)은 여기서 못 채운 잔여의 갭필러로만 쓴다.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { foodSafetyManifestSchema } from "./food-safety-schema.mjs";
import { extractDailyAmount, REGISTRY_SPEC_RULES } from "./registry-spec-rules.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");
const catalogPath = resolve(scriptDir, "../src/data/category-catalog.json");
const outputPath = resolve(dataRoot, "evidence/registry-standard-specs.json");

const manifest = foodSafetyManifestSchema.parse(
  JSON.parse(await readFile(resolve(dataRoot, "manifests/food-safety-latest.json"), "utf8")),
);
const serviceEntry = manifest.services.find((service) => service.serviceId === "C003");
if (!serviceEntry) throw new Error("Manifest is missing the C003 service");
const rawContents = await readFile(resolve(dataRoot, serviceEntry.rawFile), "utf8");
if (createHash("sha256").update(rawContents).digest("hex") !== serviceEntry.sha256) {
  throw new Error("C003 snapshot hash mismatch");
}
const snapshot = JSON.parse(rawContents);
const specByReportNo = new Map();
for (const row of snapshot.records) {
  const reportNo = String(row.PRDLST_REPORT_NO ?? "").trim();
  const standardText = String(row.STDR_STND ?? "").replace(/\s+/g, " ").trim();
  if (reportNo && standardText) {
    specByReportNo.set(reportNo, { standardText, officialName: String(row.PRDLST_NM ?? "").trim() });
  }
}
process.stdout.write(`C003 스냅샷 ${snapshot.records.length}행 · 기준규격 보유 ${specByReportNo.size}행\n`);

// 기존 증거(포털 수집분)는 C003에 없는 항목의 보충으로 유지한다
let previousEntries = [];
try {
  previousEntries = JSON.parse(await readFile(outputPath, "utf8")).entries.filter((entry) => entry.status === "ok");
} catch {
  // 첫 실행
}
const previousByReportNo = new Map(previousEntries.map((entry) => [entry.reportNo, entry]));

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const entries = [];
const summary = {};
for (const category of catalog.categories) {
  if (!REGISTRY_SPEC_RULES[category.slug]) continue;
  const bucket = (summary[category.slug] = { total: category.registry.length, ok: 0, parsed: 0 });
  for (const record of category.registry) {
    const fromC003 = specByReportNo.get(record.reportNo);
    const fallback = previousByReportNo.get(record.reportNo);
    if (!fromC003 && !fallback) continue;
    const entry = fromC003
      ? {
        reportNo: record.reportNo,
        categorySlug: category.slug,
        name: record.name,
        status: "ok",
        officialName: fromC003.officialName || record.name,
        standardText: fromC003.standardText,
        source: "C003",
        fetchedAt: manifest.downloadedAt,
      }
      : fallback;
    entries.push(entry);
    bucket.ok += 1;
    if (extractDailyAmount(category.slug, entry.standardText).reason === "ok") bucket.parsed += 1;
  }
}
entries.sort((left, right) => left.reportNo.localeCompare(right.reportNo));

await writeFile(outputPath, `${JSON.stringify({
  schemaVersion: "registry-standard-specs-v1",
  checkedAt: new Date().toISOString(),
  sourceUrl: `https://www.foodsafetykorea.go.kr/api/openApiInfo.do?svc_no=C003`,
  entries,
}, null, 1)}\n`, "utf8");

process.stdout.write(`증거 ${entries.length}건 저장 → ${outputPath}\n`);
for (const [slug, bucket] of Object.entries(summary)) {
  const ratio = bucket.total ? Math.round((bucket.parsed / bucket.total) * 100) : 0;
  process.stdout.write(`  ${slug}: 규격 ${bucket.ok}/${bucket.total} · 함량 파싱 ${bucket.parsed} (${ratio}%)\n`);
}
