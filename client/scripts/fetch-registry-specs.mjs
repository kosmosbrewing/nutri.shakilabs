// 함량 스냅샷에 없는 6개 카테고리의 등록부 전체에 대해 식품안전나라 포털에서
// 품목제조신고 기준규격 텍스트를 수집한다. 신고번호가 일치할 때만 저장한다(이름 유사 매칭 금지).
// 재실행하면 이미 수집·미발견 처리된 항목은 건너뛴다 (--retry-missing 으로 미발견 재시도).
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFoodSafetyPortalSession,
  fetchFoodSafetyProductDetail,
  foodSafetyPortalSourceUrl,
  searchFoodSafetyProducts,
} from "./food-safety-portal.mjs";
import { extractDailyAmount, REGISTRY_SPEC_RULES } from "./registry-spec-rules.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(scriptDir, "../src/data/category-catalog.json");
const outputPath = resolve(scriptDir, "../../data/evidence/registry-standard-specs.json");
const retryMissing = process.argv.includes("--retry-missing");

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const jitter = (base) => base + Math.floor(Math.random() * 200);

/** 포털 검색은 이름 변형에 민감하다 — 원문 → 특수문자 제거 → 앞 두 토큰 → 최장 토큰 순으로 시도 */
function queryVariants(name) {
  const full = name.trim().slice(0, 60);
  const stripped = full.replace(/\([^)]*\)/g, " ").replace(/[^0-9A-Za-z가-힣억\s.]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = stripped.split(" ").filter((token) => token.length >= 2);
  const firstTwo = tokens.slice(0, 2).join(" ");
  const longest = [...tokens].sort((left, right) => right.length - left.length)[0] ?? "";
  return [...new Set([full, stripped, firstTwo, longest])].filter((query) => query.length >= 2);
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return { schemaVersion: "registry-standard-specs-v1", sourceUrl: foodSafetyPortalSourceUrl, entries: [] };
  }
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const targets = [];
for (const category of catalog.categories) {
  if (!REGISTRY_SPEC_RULES[category.slug]) continue;
  for (const entry of category.registry) {
    targets.push({ categorySlug: category.slug, name: entry.name, reportNo: entry.reportNo });
  }
}

const evidence = await loadExisting();
const byReportNo = new Map(evidence.entries.map((entry) => [entry.reportNo, entry]));
const pending = targets.filter((target) => {
  const existing = byReportNo.get(target.reportNo);
  if (!existing) return true;
  return retryMissing && existing.status !== "ok";
});
process.stdout.write(`대상 ${targets.length}건 중 이번에 조회 ${pending.length}건\n`);

async function persist() {
  evidence.checkedAt = new Date().toISOString();
  evidence.entries = [...byReportNo.values()].sort((left, right) => left.reportNo.localeCompare(right.reportNo));
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 1)}\n`, "utf8");
}

let session = await createFoodSafetyPortalSession();
let done = 0;
let found = 0;
for (const target of pending) {
  done += 1;
  let entry = { reportNo: target.reportNo, categorySlug: target.categorySlug, name: target.name, status: "not_found" };
  for (const query of queryVariants(target.name)) {
    try {
      await sleep(jitter(450));
      const rows = await searchFoodSafetyProducts(session, query);
      const hit = rows.find((row) => row.prdlst_report_no.trim() === target.reportNo);
      if (!hit) continue;
      await sleep(jitter(350));
      const detail = await fetchFoodSafetyProductDetail(session, hit.prdlst_report_ledg_no);
      entry = {
        reportNo: target.reportNo,
        categorySlug: target.categorySlug,
        name: target.name,
        status: "ok",
        ledgerNo: hit.prdlst_report_ledg_no,
        officialName: detail.officialName,
        standardText: detail.standardText,
        fetchedAt: new Date().toISOString(),
      };
      found += 1;
      break;
    } catch (error) {
      const message = String(error?.message ?? error);
      if (message.includes("rate-limited")) {
        process.stdout.write(`  레이트리밋 감지 — 90초 대기 후 세션 재발급\n`);
        await sleep(90_000);
        session = await createFoodSafetyPortalSession();
      }
      // 개별 검색 실패는 다음 변형으로 계속
    }
  }
  byReportNo.set(target.reportNo, entry);
  if (done % 10 === 0) {
    await persist();
    process.stdout.write(`  진행 ${done}/${pending.length} (확보 ${found})\n`);
  }
}
await persist();

const summary = {};
for (const entry of byReportNo.values()) {
  const bucket = (summary[entry.categorySlug] ??= { ok: 0, missing: 0, parsed: 0 });
  if (entry.status !== "ok") {
    bucket.missing += 1;
    continue;
  }
  bucket.ok += 1;
  if (extractDailyAmount(entry.categorySlug, entry.standardText).reason === "ok") bucket.parsed += 1;
}
process.stdout.write(`완료: 신규 확보 ${found}건 → ${outputPath}\n`);
for (const [slug, bucket] of Object.entries(summary)) {
  process.stdout.write(`  ${slug}: 규격 확보 ${bucket.ok} · 미발견 ${bucket.missing} · 함량 파싱 ${bucket.parsed}\n`);
}
