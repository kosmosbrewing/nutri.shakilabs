import { z } from "zod";
import unitPriceDatasetInput from "@/data/unit-price-products.json";
import type { UnitPriceCategoryInput, UnitPriceProductInput } from "@/data/unit-price-types";
import { getPriceFreshness, type PriceFreshness } from "./scoring";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");
const unitSchema = z.enum(["mg", "ug"]);
const offerSchema = z.object({
  seller: z.string().trim().min(1),
  listedPriceKrw: z.number().int().positive(),
  mandatoryShippingKrw: z.number().int().nonnegative(),
  packageCount: z.number().int().positive(),
  capturedAt: dateSchema,
  url: z.url(),
  title: z.string().trim().min(1),
  affiliate: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock"]),
}).strict();
const productSchema = z.object({
  id: idSchema,
  categorySlug: idSchema,
  officialName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  servingLabel: z.string().trim().min(1),
  packageLabel: z.string().trim().min(1),
  dailyActiveAmount: z.number().positive(),
  activeUnit: unitSchema,
  totalUnitsPerPackage: z.number().int().positive(),
  unitsPerDay: z.number().positive(),
  confidence: z.enum(["A", "B"]),
  offer: offerSchema,
}).strict().refine((value) => Number.isInteger(
  value.totalUnitsPerPackage * value.offer.packageCount / value.unitsPerDay,
), { message: "Offer must resolve to a whole number of days", path: ["unitsPerDay"] });
const categorySchema = z.object({
  slug: idSchema,
  name: z.string().trim().min(1),
  activeName: z.string().trim().min(1),
  activeUnit: unitSchema,
  basisAmount: z.number().positive(),
  basisLabel: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  products: z.array(productSchema).min(3),
}).strict().superRefine((category, context) => {
  category.products.forEach((product, index) => {
    if (product.categorySlug !== category.slug || product.activeUnit !== category.activeUnit) {
      context.addIssue({ code: "custom", path: ["products", index], message: "Product category or unit mismatch" });
    }
  });
});
const datasetSchema = z.object({
  schemaVersion: z.literal("unit-price-v1"),
  updatedAt: dateSchema,
  source: z.object({
    datasetId: z.literal("15155983"),
    dataReferenceDate: dateSchema,
    url: z.url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  categories: z.array(categorySchema).length(3),
}).strict().superRefine((dataset, context) => {
  const products = dataset.categories.flatMap((category) => category.products);
  for (const field of ["id", "reportNo"] as const) {
    if (new Set(products.map((product) => product[field])).size !== products.length) {
      context.addIssue({ code: "custom", path: ["categories"], message: `Duplicate product ${field}` });
    }
  }
});

export interface UnitPriceScore {
  product: UnitPriceProductInput;
  rank: number;
  totalDays: number;
  dailyCostKrw: number;
  monthlyCostKrw: number;
  unitPriceKrw: number;
  freshness: PriceFreshness;
}

export interface UnitPriceRanking {
  category: UnitPriceCategoryInput;
  scores: UnitPriceScore[];
  updatedAt: string;
  publicSourceUrl: string;
}

export function validateUnitPriceDataset(input: unknown) {
  return datasetSchema.safeParse(input);
}

const datasetResult = validateUnitPriceDataset(unitPriceDatasetInput);
if (!datasetResult.success) {
  throw new Error(`Invalid unit price dataset: ${z.prettifyError(datasetResult.error)}`);
}
export const unitPriceDataset = datasetResult.data;

export function calculateUnitPrice(
  category: UnitPriceCategoryInput,
  product: UnitPriceProductInput,
  asOf: string,
): Omit<UnitPriceScore, "rank"> {
  const totalDays = product.totalUnitsPerPackage * product.offer.packageCount / product.unitsPerDay;
  const dailyCostKrw = (product.offer.listedPriceKrw + product.offer.mandatoryShippingKrw) / totalDays;
  return {
    product,
    totalDays,
    dailyCostKrw,
    monthlyCostKrw: dailyCostKrw * 30,
    unitPriceKrw: dailyCostKrw / (product.dailyActiveAmount / category.basisAmount),
    freshness: getPriceFreshness(product.offer.capturedAt, asOf),
  };
}

export function resolveUnitPriceRanking(
  slugInput: unknown,
  asOfInput: unknown = unitPriceDataset.updatedAt,
): UnitPriceRanking | null {
  const slugResult = idSchema.safeParse(slugInput);
  const asOfResult = dateSchema.safeParse(asOfInput);
  if (!slugResult.success || !asOfResult.success) return null;
  const category = unitPriceDataset.categories.find(({ slug }) => slug === slugResult.data);
  if (!category) return null;
  const confidenceOrder = { A: 0, B: 1 } as const;
  const scores = category.products
    .filter(({ offer }) => offer.availability === "in_stock")
    .map((product) => calculateUnitPrice(category, product, asOfResult.data))
    .filter(({ freshness }) => freshness !== "stale")
    .sort((a, b) => a.unitPriceKrw - b.unitPriceKrw
      || confidenceOrder[a.product.confidence] - confidenceOrder[b.product.confidence]
      || b.product.offer.capturedAt.localeCompare(a.product.offer.capturedAt)
      || a.product.displayName.localeCompare(b.product.displayName, "ko"))
    .map((score, index) => ({ ...score, rank: index + 1 }));
  return { category, scores, updatedAt: unitPriceDataset.updatedAt, publicSourceUrl: unitPriceDataset.source.url };
}

export function formatUnitPriceWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value)}원`;
}

export function formatUnitPriceAmount(value: number, unit: "mg" | "ug"): string {
  const amount = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
  return `${amount} ${unit === "ug" ? "μg" : "mg"}`;
}
