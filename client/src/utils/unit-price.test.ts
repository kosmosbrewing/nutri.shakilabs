import { describe, expect, it } from "vitest";
import unitPriceDatasetInput from "@/data/unit-price-products.json";
import {
  resolveUnitPriceRanking,
  unitPriceDataset,
  validateUnitPriceDataset,
} from "./unit-price";

describe("unit-price-v1 dataset", () => {
  it("publishes three independent categories with three products each", () => {
    expect(unitPriceDataset.categories.map(({ slug }) => slug)).toEqual([
      "vitamin-d",
      "vitamin-c",
      "calcium",
    ]);
    expect(unitPriceDataset.categories.every(({ products }) => products.length === 3)).toBe(true);
  });

  it("rejects a product assigned to the wrong category", () => {
    const invalid = structuredClone(unitPriceDatasetInput);
    invalid.categories[0].products[0].categorySlug = "vitamin-c";
    expect(validateUnitPriceDataset(invalid).success).toBe(false);
  });
});

describe("unit-price-v1 scoring", () => {
  it("includes set quantity and compares vitamin D per 10 ug", () => {
    const ranking = resolveUnitPriceRanking("vitamin-d", "2026-07-11");
    expect(ranking?.scores.map(({ product }) => product.id)).toEqual([
      "nutri-sun-d3-5000",
      "nutri-sun-d3-2000",
      "modern-formula-d-2000",
    ]);
    expect(ranking?.scores[0].totalDays).toBe(540);
    expect(ranking?.scores[0].unitPriceKrw).toBeCloseTo(4.86, 2);
  });

  it("includes mandatory shipping and units per day", () => {
    const ranking = resolveUnitPriceRanking("vitamin-c", "2026-07-11");
    const product = ranking?.scores.find(({ product }) => product.id === "korea-eundan-c-easy-d");
    expect(product?.totalDays).toBe(60);
    expect(product?.dailyCostKrw).toBeCloseTo(205.17, 2);
    expect(product?.unitPriceKrw).toBeCloseTo(20.52, 2);
  });

  it("does not compare products across categories", () => {
    expect(resolveUnitPriceRanking("multivitamin", "2026-07-11")).toBeNull();
    expect(resolveUnitPriceRanking("../calcium", "2026-07-11")).toBeNull();
  });

  it("excludes prices older than 30 days", () => {
    expect(resolveUnitPriceRanking("calcium", "2026-08-11")?.scores).toHaveLength(0);
  });
});
