import type {
  ConfidenceGrade,
  NutrientReference,
  NutrientUnit,
  OfferSnapshot,
  Product,
  ProductNutrient,
} from "@/data/types";

export const SCORE_VERSION = "value-v1" as const;

export type PriceFreshness = "fresh" | "refresh_required" | "stale";

export interface NutrientCoverage {
  nutrientId: string;
  dailyAmount: number;
  target: number;
  unit: NutrientUnit;
  ratio: number;
}

export interface ProductScore {
  productId: string;
  productName: string;
  confidence: ConfidenceGrade;
  capturedAt: string;
  scoreVersion: typeof SCORE_VERSION;
  coverageScore: number;
  dailyCostKrw: number;
  monthlyCostKrw: number;
  valueIndex: number;
  freshness: Exclude<PriceFreshness, "stale">;
  coverage: NutrientCoverage[];
}

export type ScoreResult =
  | { success: true; score: ProductScore }
  | {
      success: false;
      reason: "not_rankable" | "missing_nutrient" | "unknown_nutrient" | "invalid_offer" | "stale_offer";
      detail: string;
    };

export function convertAmount(
  amount: number,
  from: NutrientUnit,
  to: NutrientUnit,
): number {
  if (from === to) return amount;
  if (from === "mg" && to === "ug") return amount * 1000;
  if (from === "ug" && to === "mg") return amount / 1000;
  throw new Error(`Unsupported nutrient unit conversion: ${from} to ${to}`);
}

function calendarDay(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) / 86_400_000;
}

export function getPriceFreshness(capturedAt: string, asOf: string): PriceFreshness {
  const ageDays = calendarDay(asOf) - calendarDay(capturedAt);
  if (!Number.isFinite(ageDays) || ageDays < 0) {
    throw new Error("Offer capture date must not be in the future");
  }
  if (ageDays > 30) return "stale";
  if (ageDays > 14) return "refresh_required";
  return "fresh";
}

export function calculateDailyCost(product: Product, offer: OfferSnapshot): number {
  const totalCost = offer.listedPriceKrw + offer.mandatoryShippingKrw;
  const coveredDays = product.totalDays * offer.quantityMultiplier;
  if (totalCost <= 0 || coveredDays <= 0) {
    throw new Error("Offer cost and covered days must be positive");
  }
  return totalCost / coveredDays;
}

function buildCoverage(
  product: Product,
  references: NutrientReference[],
  nutrients: ProductNutrient[],
): NutrientCoverage[] | ScoreResult {
  const byNutrient = new Map(nutrients.map((item) => [item.nutrientId, item]));
  if (byNutrient.size !== nutrients.length) {
    return { success: false, reason: "missing_nutrient", detail: "Duplicate nutrient rows" };
  }

  const coverage: NutrientCoverage[] = [];
  for (const reference of references) {
    const item = byNutrient.get(reference.id);
    if (!item) {
      return { success: false, reason: "missing_nutrient", detail: reference.id };
    }
    if (item.presence === "unknown" || item.amountPerServing === null) {
      return { success: false, reason: "unknown_nutrient", detail: reference.id };
    }
    const amount = convertAmount(
      item.amountPerServing * product.servingsPerDay,
      item.canonicalUnit,
      reference.canonicalUnit,
    );
    coverage.push({
      nutrientId: reference.id,
      dailyAmount: amount,
      target: reference.dailyTarget,
      unit: reference.canonicalUnit,
      ratio: Math.min(amount / reference.dailyTarget, 1),
    });
  }
  return coverage;
}

export function scoreProduct(input: {
  product: Product;
  references: NutrientReference[];
  nutrients: ProductNutrient[];
  offer: OfferSnapshot;
  asOf: string;
}): ScoreResult {
  const { product, references, nutrients, offer, asOf } = input;
  if (product.status !== "rankable" || product.confidence === "C") {
    return { success: false, reason: "not_rankable", detail: product.status };
  }
  if (offer.productId !== product.id || offer.availability !== "in_stock") {
    return { success: false, reason: "invalid_offer", detail: offer.id };
  }

  const freshness = getPriceFreshness(offer.capturedAt, asOf);
  if (freshness === "stale") {
    return { success: false, reason: "stale_offer", detail: offer.capturedAt };
  }
  const coverage = buildCoverage(product, references, nutrients);
  if (!Array.isArray(coverage)) return coverage;
  if (coverage.length === 0) {
    return { success: false, reason: "missing_nutrient", detail: "No target nutrients" };
  }

  const coverageScore = 100 * coverage.reduce((sum, item) => sum + item.ratio, 0) / coverage.length;
  const dailyCostKrw = calculateDailyCost(product, offer);
  return {
    success: true,
    score: {
      productId: product.id,
      productName: product.officialName,
      confidence: product.confidence,
      capturedAt: offer.capturedAt,
      scoreVersion: SCORE_VERSION,
      coverageScore,
      dailyCostKrw,
      monthlyCostKrw: dailyCostKrw * 30,
      valueIndex: 100 * coverageScore / dailyCostKrw,
      freshness,
      coverage,
    },
  };
}

export function rankScores(scores: ProductScore[]): ProductScore[] {
  const confidenceOrder: Record<ConfidenceGrade, number> = { A: 0, B: 1, C: 2 };
  return [...scores].sort((left, right) =>
    right.valueIndex - left.valueIndex
    || confidenceOrder[left.confidence] - confidenceOrder[right.confidence]
    || right.capturedAt.localeCompare(left.capturedAt)
    || left.productName.localeCompare(right.productName, "ko"),
  );
}
