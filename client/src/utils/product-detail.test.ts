import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { buildRankingItems } from "./ranking";
import { buildProductDetail, parseProductSlug } from "./product-detail";

describe("product detail evidence", () => {
  it("accepts only a known product slug", () => {
    const validSlugs = nutriDataset.products.map((product) => product.slug);
    expect(parseProductSlug(validSlugs[0], validSlugs).success).toBe(true);
    expect(parseProductSlug("unknown-product", validSlugs).success).toBe(false);
    expect(parseProductSlug([validSlugs[0]], validSlugs).success).toBe(false);
  });

  it("builds 23 nutrition rows and linked sources for every product", () => {
    const ranking = buildRankingItems(nutriDataset);
    if (!ranking.success) throw new Error(ranking.detail);
    for (const item of ranking.items) {
      const detail = buildProductDetail(nutriDataset, item);
      expect(detail.nutritionRows).toHaveLength(23);
      expect(detail.sources.length).toBeGreaterThanOrEqual(2);
      expect(detail.sources.every((source) => source.productId === item.product.id)).toBe(true);
    }
  });
});
