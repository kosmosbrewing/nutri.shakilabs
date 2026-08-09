import { z } from "zod";
import catalogInput from "@/data/category-catalog.json";
import { isRankingEligible, resolveUnitPriceRanking, unitPriceDataset } from "./unit-price";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const recordSchema = z.object({
  name: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  servingSize: z.string().trim().min(1),
  dailyFrequency: z.string().trim().min(1),
  dataCreatedAt: dateSchema,
  activeAmount: z.number().nonnegative().nullable(),
}).strict();
const registryRecordSchema = z.object({
  name: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  servingSize: z.string().trim().min(1),
  dailyFrequency: z.string().trim().min(1),
  activeAmount: z.number().nonnegative().nullable(),
}).strict();
const categorySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  datasetLabel: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  comparisonBasis: z.string().trim().min(1),
  analysisState: z.enum(["amount_in_snapshot", "amount_from_spec", "identity_only"]),
  activeUnit: z.enum(["mg", "ug", "억 CFU"]).nullable(),
  recordCount: z.number().int().positive(),
  nextEvidence: z.array(z.string().trim().min(1)).min(2),
  records: z.array(recordSchema).length(6),
  registry: z.array(registryRecordSchema).min(6),
}).strict();
const catalogSchema = z.object({
  schemaVersion: z.literal("category-catalog-v1"),
  source: z.object({
    datasetId: z.literal("15155983"),
    dataReferenceDate: dateSchema,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  categories: z.array(categorySchema).length(9),
}).strict();

const catalogResult = catalogSchema.safeParse(catalogInput);
if (!catalogResult.success) {
  throw new Error(`Invalid category catalog: ${z.prettifyError(catalogResult.error)}`);
}

export type CategoryCatalogEntry = z.infer<typeof categorySchema>;
export type CategoryCatalogRecord = z.infer<typeof recordSchema>;
export type CategoryRegistryRecord = z.infer<typeof registryRecordSchema>;
export type CategoryCardStatus = "ranking" | "unit_price" | "official_catalog";

export interface CategoryCardItem {
  slug: string;
  name: string;
  summary: string;
  count: number;
  countLabel: string;
  status: CategoryCardStatus;
  href: string;
}

export const categoryCatalog = catalogResult.data;
export const catalogCategories = categoryCatalog.categories;

const multivitaminCard: CategoryCardItem = {
  slug: "multivitamin",
  name: "멀티비타민",
  summary: "23개 영양소와 최신 가격 근거를 갖춘 독립 가격효율 랭킹",
  count: 10,
  countLabel: "검증 제품",
  status: "ranking",
  href: "/nutri#ranking",
};

export const categoryCards: CategoryCardItem[] = [
  multivitaminCard,
  ...catalogCategories.map((category) => {
    const comparison = unitPriceDataset.categories.find(({ slug }) => slug === category.slug);
    // 순위 표기 기준(검증 제품 4개+·신선한 가격)을 충족한 카테고리만 ranking으로 승격
    const ranking = comparison ? resolveUnitPriceRanking(category.slug) : null;
    const ranked = ranking !== null && isRankingEligible(ranking);
    return {
      slug: category.slug,
      name: category.name,
      summary: comparison?.summary ?? category.summary,
      count: comparison?.products.length ?? category.recordCount,
      countLabel: comparison ? "검증 제품" : "공식 레코드",
      status: ranked ? "ranking" as const : comparison ? "unit_price" as const : "official_catalog" as const,
      href: `/nutri/categories/${category.slug}`,
    };
  }),
];

export interface CategoryGuideRow {
  slug: string;
  name: string;
  status: CategoryCardStatus;
  basis: string;
  countLabel: string;
  href: string;
}

// 허브에서 종류별 "무엇을 비교하는가"를 보여주기 위해 카드 상태와 카탈로그 비교 기준을 합친다.
const multivitaminGuideRow: CategoryGuideRow = {
  slug: multivitaminCard.slug,
  name: multivitaminCard.name,
  status: multivitaminCard.status,
  basis: "23개 영양소 충족률과 배송비 포함 1일 비용",
  countLabel: `검증 제품 ${multivitaminCard.count}개`,
  href: multivitaminCard.href,
};

export const categoryGuideRows: CategoryGuideRow[] = [
  multivitaminGuideRow,
  ...catalogCategories.map((category) => {
    const card = categoryCards.find(({ slug }) => slug === category.slug);
    return {
      slug: category.slug,
      name: category.name,
      status: card?.status ?? "official_catalog" as const,
      basis: category.comparisonBasis,
      countLabel: `공식 레코드 ${category.recordCount.toLocaleString("ko-KR")}건`,
      href: `/nutri/categories/${category.slug}`,
    };
  }),
];

export function findCategory(slugInput: unknown): CategoryCatalogEntry | null {
  const result = slugSchema.safeParse(slugInput);
  if (!result.success) return null;
  return catalogCategories.find((category) => category.slug === result.data) ?? null;
}

export function formatActiveAmount(amount: number, unit: "mg" | "ug" | "억 CFU"): string {
  const formatted = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(amount);
  // 균수는 "100억 CFU"처럼 단위가 숫자에 붙어 읽힌다
  if (unit === "억 CFU") return `${formatted}억 CFU`;
  return `${formatted} ${unit === "ug" ? "μg" : "mg"}`;
}

// 등록부 함량 순위 — competition 방식(동일 함량 = 동일 순위, 다음 순위는 건너뜀).
// 등록부는 함량 내림차순·미기재 후순위 정렬이 계약이므로 인덱스가 곧 순위 기준이 된다.
export function buildRegistryRanks(registry: CategoryRegistryRecord[]): (number | null)[] {
  let rank = 0;
  let previousAmount: number | null = null;
  return registry.map((record, index) => {
    if (record.activeAmount === null) return null;
    if (record.activeAmount !== previousAmount) {
      rank = index + 1;
      previousAmount = record.activeAmount;
    }
    return rank;
  });
}
