import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import {
  buildRankingItems,
  DEFAULT_RANKING_FILTERS,
  filterRankingItems,
} from "./ranking";

function getItems() {
  const result = buildRankingItems(nutriDataset);
  if (!result.success) throw new Error(result.detail);
  return result.items;
}

describe("ranking view model", () => {
  it("builds ten finite scores in value order", () => {
    const items = getItems();
    expect(items).toHaveLength(10);
    expect(items.every((item) => Number.isFinite(item.score.valueIndex))).toBe(true);
    expect(items.every((item, index) => index === 0
      || items[index - 1]!.score.valueIndex >= item.score.valueIndex)).toBe(true);
  });

  it("filters by brand and monthly budget", () => {
    const result = filterRankingItems(getItems(), {
      ...DEFAULT_RANKING_FILTERS,
      brand: "센트룸",
      budget: "under-10000",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.product.brand === "센트룸")).toBe(true);
    expect(result.items.every((item) => item.score.monthlyCostKrw <= 10_000)).toBe(true);
  });

  it("searches Korean product names", () => {
    const result = filterRankingItems(getItems(), {
      ...DEFAULT_RANKING_FILTERS,
      query: "베로카",
    });
    expect(result.success && result.items.map((item) => item.product.id)).toEqual([
      "berocca-30",
    ]);
  });

  it("rejects untrusted filter values", () => {
    const result = filterRankingItems(getItems(), {
      ...DEFAULT_RANKING_FILTERS,
      budget: "free",
    });
    expect(result.success).toBe(false);
  });
});
