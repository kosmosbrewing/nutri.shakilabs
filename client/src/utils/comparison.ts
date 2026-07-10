import { z } from "zod";
import type { NutrientReference, SourceEvidence } from "@/data/types";
import type { RankingItem } from "./ranking";

export const MIN_COMPARE_COUNT = 2;
export const MAX_COMPARE_COUNT = 4;

const queryValueSchema = z.union([z.string(), z.array(z.string())]);
const productIdSchema = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/);

export type ComparisonIdResult =
  | { success: true; ids: string[] }
  | { success: false; detail: string };

export interface ComparisonEntry {
  item: RankingItem;
  sources: SourceEvidence[];
}

export interface ComparisonViewModel {
  entries: ComparisonEntry[];
  references: NutrientReference[];
}

export function parseComparisonIds(input: unknown, validIds: string[]): ComparisonIdResult {
  const queryResult = queryValueSchema.safeParse(input);
  if (!queryResult.success) return { success: false, detail: "비교할 제품을 선택해 주세요." };

  const rawIds = Array.isArray(queryResult.data)
    ? queryResult.data.flatMap((value) => value.split(","))
    : queryResult.data.split(",");
  const ids = [...new Set(rawIds.map((value) => value.trim()).filter(Boolean))];

  const idsResult = z.array(productIdSchema)
    .min(MIN_COMPARE_COUNT)
    .max(MAX_COMPARE_COUNT)
    .safeParse(ids);
  if (!idsResult.success) {
    return { success: false, detail: "제품을 2개 이상 4개 이하로 선택해 주세요." };
  }
  const validIdSet = new Set(validIds);
  if (idsResult.data.some((id) => !validIdSet.has(id))) {
    return { success: false, detail: "검증되지 않은 제품이 비교 목록에 포함되어 있습니다." };
  }
  return { success: true, ids: idsResult.data };
}

export function formatCoverageRatio(ratio: number): string {
  return `${(Math.min(ratio, 1) * 100).toFixed(0)}%`;
}

export function buildComparisonEntries(
  ids: string[],
  items: RankingItem[],
  sources: SourceEvidence[],
): ComparisonEntry[] {
  return ids.map((id) => {
    const item = items.find((candidate) => candidate.product.id === id);
    if (!item) throw new Error(`Missing comparison product: ${id}`);
    const sourceIds = new Set([
      item.product.identitySourceId,
      item.product.labelSourceId,
      item.offer.sourceId,
    ]);
    return {
      item,
      sources: sources.filter((source) => sourceIds.has(source.id)),
    };
  });
}
