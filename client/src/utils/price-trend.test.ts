import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { priceHistory } from "@/data/price-history";
import { buildPriceTrend, formatTrendPercent } from "./price-trend";

describe("price trend against the previous snapshot", () => {
  it("keeps history snapshots consistent with the current catalog", () => {
    const productIds = new Set(nutriDataset.products.map((product) => product.id));
    for (const snapshot of priceHistory) {
      expect(snapshot.capturedAt < nutriDataset.updatedAt).toBe(true);
      for (const id of Object.keys(snapshot.offers)) {
        expect(productIds.has(id)).toBe(true);
      }
    }
  });

  it("computes the acebiome drop that swapped rank one", () => {
    // 07-10: 23,920원/60일 = 399원 → 07-29: 140원
    const trend = buildPriceTrend("acebiome-multivitamin-60", 60, 140);
    expect(trend).not.toBeNull();
    expect(trend!.baselineDailyCostKrw).toBe(399);
    expect(trend!.baselineDateLabel).toBe("07.10");
    expect(Math.round(trend!.changePercent)).toBe(-65);
  });

  it("returns null for unknown products and formats signs", () => {
    expect(buildPriceTrend("unknown-product", 60, 100)).toBeNull();
    expect(formatTrendPercent(-64.9)).toBe("-65%");
    expect(formatTrendPercent(16.2)).toBe("+16%");
    expect(formatTrendPercent(0.2)).toBe("0%");
  });
});
