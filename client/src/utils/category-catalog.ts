import { z } from "zod";
import catalogInput from "@/data/category-catalog.json";
import { unitPriceDataset } from "./unit-price";

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
const categorySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1),
  datasetLabel: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  comparisonBasis: z.string().trim().min(1),
  analysisState: z.enum(["amount_in_snapshot", "identity_only"]),
  activeUnit: z.enum(["mg", "ug"]).nullable(),
  recordCount: z.number().int().positive(),
  nextEvidence: z.array(z.string().trim().min(1)).min(2),
  records: z.array(recordSchema).length(6),
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
    return {
      slug: category.slug,
      name: category.name,
      summary: comparison?.summary ?? category.summary,
      count: comparison?.products.length ?? category.recordCount,
      countLabel: comparison ? "검증 제품" : "공식 레코드",
      status: comparison ? "unit_price" as const : "official_catalog" as const,
      href: `/nutri/categories/${category.slug}`,
    };
  }),
];

export function findCategory(slugInput: unknown): CategoryCatalogEntry | null {
  const result = slugSchema.safeParse(slugInput);
  if (!result.success) return null;
  return catalogCategories.find((category) => category.slug === result.data) ?? null;
}

export function formatActiveAmount(amount: number, unit: "mg" | "ug"): string {
  const label = unit === "ug" ? "μg" : "mg";
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(amount)} ${label}`;
}
