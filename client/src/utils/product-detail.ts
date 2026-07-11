import { z } from "zod";
import type { NutriDataset, NutrientReference, ProductNutrient, SourceEvidence } from "@/data/types";
import type { NutrientCoverage } from "./scoring";
import type { RankingItem } from "./ranking";

export type ProductSlugResult =
  | { success: true; slug: string }
  | { success: false; detail: string };

export interface ProductNutritionRow {
  reference: NutrientReference;
  nutrient: ProductNutrient;
  coverage: NutrientCoverage;
}

export interface ProductDetailModel {
  item: RankingItem;
  nutritionRows: ProductNutritionRow[];
  sources: SourceEvidence[];
}

export interface ProductAlternative {
  item: RankingItem;
  dailyCostGapKrw: number;
  coverageGap: number;
}

export function parseProductSlug(input: unknown, validSlugs: string[]): ProductSlugResult {
  const parsed = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).safeParse(input);
  if (!parsed.success || !validSlugs.includes(parsed.data)) {
    return { success: false, detail: "검증된 제품을 찾을 수 없습니다." };
  }
  return { success: true, slug: parsed.data };
}

export function buildProductDetail(
  dataset: NutriDataset,
  item: RankingItem,
): ProductDetailModel {
  const nutritionRows = dataset.nutrientReferences.map((reference) => {
    const nutrient = dataset.productNutrients.find((candidate) =>
      candidate.productId === item.product.id && candidate.nutrientId === reference.id);
    const coverage = item.score.coverage.find((candidate) => candidate.nutrientId === reference.id);
    if (!nutrient || !coverage) throw new Error(`Missing product nutrient: ${item.product.id}/${reference.id}`);
    return { reference, nutrient, coverage };
  });
  const sourceIds = new Set([
    item.product.identitySourceId,
    item.product.labelSourceId,
    item.offer.sourceId,
  ]);
  return {
    item,
    nutritionRows,
    sources: dataset.sources.filter((source) => sourceIds.has(source.id)),
  };
}

export function buildProductAlternatives(
  items: RankingItem[],
  currentProductId: string,
  limit = 3,
): ProductAlternative[] {
  const current = items.find((item) => item.product.id === currentProductId);
  if (!current || limit <= 0) return [];

  return items
    .filter((item) => item.product.id !== currentProductId)
    .map((item) => ({
      item,
      dailyCostGapKrw: Math.abs(item.score.dailyCostKrw - current.score.dailyCostKrw),
      coverageGap: Math.abs(item.score.coverageScore - current.score.coverageScore),
    }))
    .sort((a, b) =>
      a.dailyCostGapKrw - b.dailyCostGapKrw
      || a.coverageGap - b.coverageGap
      || a.item.overallRank - b.item.overallRank)
    .slice(0, limit);
}
