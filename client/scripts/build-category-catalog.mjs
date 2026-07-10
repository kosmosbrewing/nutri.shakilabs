import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categoryCatalogSchema } from "./category-catalog-schema.mjs";
import {
  manifestSchema,
  parseJsonResponse,
  rawSnapshotSchema,
} from "./public-data-schema.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");
const outputPath = resolve(scriptDir, "../src/data/category-catalog.json");

const categorySpecs = [
  { slug: "vitamin-d", name: "비타민D", label: "비타민 D", pattern: /비타민\s*d/i, amount: "VITD", unit: "ug", summary: "비타민D 중심 제품의 공식 등록 현황", basis: "1일 비타민D 함량과 1일 비용", needs: ["현재 판매가·필수 배송비", "총 복용일수", "제조사 전체 라벨"] },
  { slug: "probiotics", name: "프로바이오틱스", label: "프로바이오틱스", pattern: /프로바이오틱스|유산균|비피/i, summary: "프로바이오틱스 기능성 원료 제품의 공식 등록 현황", basis: "보장 균수·균주 구성과 1일 비용", needs: ["유통기한까지 보장 균수", "균주 구성", "현재 판매가·총 복용일수"] },
  { slug: "vitamin-c", name: "비타민C", label: "비타민 C", pattern: /비타민\s*c|비타민\s*씨/i, amount: "VITC", unit: "mg", summary: "비타민C 중심 제품의 공식 등록 현황", basis: "1일 비타민C 함량과 1일 비용", needs: ["현재 판매가·필수 배송비", "총 복용일수", "제조사 전체 라벨"] },
  { slug: "omega-3", name: "오메가3", label: "EPA 및 DHA 함유 유지", pattern: /오메가/i, summary: "EPA·DHA 함유 유지 제품의 공식 등록 현황", basis: "1일 EPA+DHA 함량과 1일 비용", needs: ["EPA+DHA 실제 함량", "원료·제형 정보", "현재 판매가·총 복용일수"] },
  { slug: "magnesium", name: "마그네슘", label: "마그네슘", pattern: /마그네슘/i, summary: "마그네슘 중심 제품의 공식 등록 현황", basis: "1일 마그네슘 함량과 1일 비용", needs: ["마그네슘 실제 함량", "원료 형태", "현재 판매가·총 복용일수"] },
  { slug: "calcium", name: "칼슘", label: "칼슘", pattern: /칼슘/i, amount: "CA", unit: "mg", summary: "칼슘 중심 제품의 공식 등록 현황", basis: "1일 칼슘 함량과 1일 비용", needs: ["현재 판매가·필수 배송비", "총 복용일수", "제조사 전체 라벨"] },
  { slug: "msm", name: "MSM", label: "엠에스엠", pattern: /msm|엠에스엠/i, summary: "MSM 기능성 원료 제품의 공식 등록 현황", basis: "1일 MSM 함량과 1일 비용", needs: ["MSM 실제 함량", "제조사 전체 라벨", "현재 판매가·총 복용일수"] },
  { slug: "coenzyme-q10", name: "코엔자임Q10", label: "코엔자임Q10", pattern: /코엔자임|코큐텐|q10/i, summary: "코엔자임Q10 기능성 원료 제품의 공식 등록 현황", basis: "1일 코엔자임Q10 함량과 1일 비용", needs: ["코엔자임Q10 실제 함량", "제조사 전체 라벨", "현재 판매가·총 복용일수"] },
  { slug: "milk-thistle", name: "밀크씨슬", label: "밀크씨슬 추출물", pattern: /밀크씨슬|실리마린/i, summary: "밀크씨슬 추출물 제품의 공식 등록 현황", basis: "1일 실리마린 함량과 1일 비용", needs: ["실리마린 실제 함량", "제조사 전체 라벨", "현재 판매가·총 복용일수"] },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

function text(value) {
  return String(value ?? "").trim();
}

function activeAmount(row, field) {
  if (!field) return null;
  const value = Number(text(row[field]).replaceAll(",", ""));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function selectRecords(rows, spec) {
  const eligible = rows
    .filter((row) => text(row.FOOD_NM).length >= 4
      && text(row.ITEM_MNFTR_RPT_NO)
      && text(row.MFR_NM)
      && text(row.ONETM_QNT)
      && normalize(row.FOOD_NM) !== normalize(spec.label))
    .sort((left, right) => Number(spec.pattern.test(right.FOOD_NM)) - Number(spec.pattern.test(left.FOOD_NM))
      || text(right.CRT_YMD).localeCompare(text(left.CRT_YMD))
      || text(left.FOOD_NM).localeCompare(text(right.FOOD_NM), "ko"));
  const names = new Set();
  const manufacturers = new Set();
  const selected = [];
  for (const row of eligible) {
    const nameKey = normalize(row.FOOD_NM);
    const manufacturerKey = normalize(row.MFR_NM);
    if (names.has(nameKey) || manufacturers.has(manufacturerKey)) continue;
    names.add(nameKey);
    manufacturers.add(manufacturerKey);
    selected.push({
      name: text(row.FOOD_NM),
      manufacturer: text(row.MFR_NM),
      reportNo: text(row.ITEM_MNFTR_RPT_NO),
      servingSize: text(row.ONETM_QNT),
      dailyFrequency: text(row.ONETM_INTK_NMTM),
      dataCreatedAt: text(row.CRT_YMD),
      activeAmount: activeAmount(row, spec.amount),
    });
    if (selected.length === 6) break;
  }
  if (selected.length !== 6) throw new Error(`${spec.slug}: six diverse records are required`);
  return selected;
}

const manifestInput = JSON.parse(await readFile(resolve(dataRoot, "manifests/latest.json"), "utf8"));
const manifest = parseJsonResponse(manifestSchema, manifestInput, "Manifest");
const rawContents = await readFile(resolve(dataRoot, manifest.rawFile), "utf8");
const snapshot = parseJsonResponse(rawSnapshotSchema, JSON.parse(rawContents), "Raw snapshot");
const rawHash = createHash("sha256").update(rawContents).digest("hex");
if (rawHash !== manifest.sha256) throw new Error("Raw snapshot hash mismatch");

const catalogInput = {
  schemaVersion: "category-catalog-v1",
  source: {
    datasetId: manifest.datasetId,
    dataReferenceDate: manifest.dataReferenceDate,
    sha256: manifest.sha256,
  },
  categories: categorySpecs.map((spec) => {
    const rows = snapshot.records.filter((row) => row.FOOD_LV4_NM === spec.label);
    return {
      slug: spec.slug,
      name: spec.name,
      datasetLabel: spec.label,
      summary: spec.summary,
      comparisonBasis: spec.basis,
      analysisState: spec.amount ? "amount_in_snapshot" : "identity_only",
      activeUnit: spec.unit ?? null,
      recordCount: rows.length,
      nextEvidence: spec.needs,
      records: selectRecords(rows, spec),
    };
  }),
};
const catalog = parseJsonResponse(categoryCatalogSchema, catalogInput, "Category catalog");
await writeFile(outputPath, `${JSON.stringify(catalog)}\n`);
process.stdout.write(`Generated ${catalog.categories.length} categories at ${outputPath}.\n`);
