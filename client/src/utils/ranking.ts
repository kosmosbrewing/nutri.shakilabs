import { z } from "zod";
import type { NutriDataset, OfferSnapshot, Product } from "@/data/types";
import { rankScores, scoreProduct, type ProductScore } from "./scoring";

export const rankingFilterSchema = z.object({
  query: z.string().max(80),
  brand: z.string().min(1).max(40),
  budget: z.enum(["all", "under-10000", "under-15000", "under-20000"]),
  confidence: z.enum(["all", "A"]),
  sort: z.enum(["value", "coverage", "cost"]),
}).strict();

export type RankingFilters = z.infer<typeof rankingFilterSchema>;
export type RankingFilterKey = keyof RankingFilters;

export interface RankingItem {
  product: Product;
  offer: OfferSnapshot;
  score: ProductScore;
  overallRank: number;
  metNutrientCount: number;
  nutrientCount: number;
}

export type RankingBuildResult =
  | { success: true; items: RankingItem[] }
  | { success: false; detail: string };

export const DEFAULT_RANKING_FILTERS: RankingFilters = {
  query: "",
  brand: "all",
  budget: "all",
  confidence: "all",
  sort: "value",
};

const budgetLimits: Record<RankingFilters["budget"], number> = {
  all: Number.POSITIVE_INFINITY,
  "under-10000": 10_000,
  "under-15000": 15_000,
  "under-20000": 20_000,
};

export function buildRankingItems(dataset: NutriDataset): RankingBuildResult {
  const scorePairs: Array<{ product: Product; offer: OfferSnapshot; score: ProductScore }> = [];

  for (const product of dataset.products) {
    const offer = dataset.offers.find((item) => item.productId === product.id);
    if (!offer) return { success: false, detail: `Missing offer: ${product.id}` };
    const result = scoreProduct({
      product,
      offer,
      references: dataset.nutrientReferences,
      nutrients: dataset.productNutrients.filter((item) => item.productId === product.id),
      asOf: dataset.updatedAt,
    });
    if (!result.success) {
      return { success: false, detail: `${product.id}: ${result.reason} (${result.detail})` };
    }
    scorePairs.push({ product, offer, score: result.score });
  }

  const byProduct = new Map(scorePairs.map((item) => [item.product.id, item]));
  const items = rankScores(scorePairs.map((item) => item.score)).map((score, index) => {
    const pair = byProduct.get(score.productId);
    if (!pair) throw new Error(`Missing scored product: ${score.productId}`);
    return {
      ...pair,
      score,
      overallRank: index + 1,
      metNutrientCount: score.coverage.filter((item) => item.ratio >= 1).length,
      nutrientCount: score.coverage.length,
    };
  });
  return { success: true, items };
}

export function filterRankingItems(
  items: RankingItem[],
  input: unknown,
): { success: true; items: RankingItem[] } | { success: false; detail: string } {
  const parsed = rankingFilterSchema.safeParse(input);
  if (!parsed.success) return { success: false, detail: parsed.error.message };
  const filters = parsed.data;
  const brands = new Set(items.map((item) => item.product.brand));
  if (filters.brand !== "all" && !brands.has(filters.brand)) {
    return { success: false, detail: `Unknown brand: ${filters.brand}` };
  }

  const query = filters.query.trim().toLocaleLowerCase("ko");
  const filtered = items.filter((item) => {
    const searchable = `${item.product.brand} ${item.product.officialName}`.toLocaleLowerCase("ko");
    return (!query || searchable.includes(query))
      && (filters.brand === "all" || item.product.brand === filters.brand)
      && item.score.monthlyCostKrw <= budgetLimits[filters.budget]
      && (filters.confidence === "all" || item.product.confidence === "A");
  });

  const sorted = [...filtered].sort((left, right) => {
    if (filters.sort === "coverage") {
      return right.score.coverageScore - left.score.coverageScore
        || right.score.valueIndex - left.score.valueIndex;
    }
    if (filters.sort === "cost") {
      return left.score.dailyCostKrw - right.score.dailyCostKrw
        || right.score.coverageScore - left.score.coverageScore;
    }
    return left.overallRank - right.overallRank;
  });
  return { success: true, items: sorted };
}

export function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}
