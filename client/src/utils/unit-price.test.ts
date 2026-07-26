import { describe, expect, it } from "vitest";
import unitPriceDatasetInput from "@/data/unit-price-products.json";
import {
  formatPriceEfficiency,
  isRankingEligible,
  resolveUnitPriceRanking,
  unitPriceDataset,
  validateUnitPriceDataset,
} from "./unit-price";

describe("unit-price-v1 dataset", () => {
  it("publishes nine independent categories with expanded ranking pools", () => {
    expect(unitPriceDataset.categories.map(({ slug }) => slug)).toEqual([
      "vitamin-d",
      "probiotics",
      "vitamin-c",
      "omega-3",
      "magnesium",
      "calcium",
      "msm",
      "coenzyme-q10",
      "milk-thistle",
    ]);
    const counts = Object.fromEntries(
      unitPriceDataset.categories.map(({ slug, products }) => [slug, products.length]),
    );
    expect(counts).toEqual({
      "vitamin-d": 4,
      probiotics: 3,
      "vitamin-c": 7,
      "omega-3": 3,
      magnesium: 3,
      calcium: 4,
      msm: 3,
      "coenzyme-q10": 3,
      "milk-thistle": 3,
    });
  });

  it("marks only pools of four or more as ranking-eligible", () => {
    const eligible = unitPriceDataset.categories
      .map(({ slug }) => resolveUnitPriceRanking(slug, "2026-07-26"))
      .filter((ranking): ranking is NonNullable<typeof ranking> => ranking !== null)
      .filter((ranking) => isRankingEligible(ranking))
      .map(({ category }) => category.slug);
    expect(eligible).toEqual(["vitamin-d", "vitamin-c", "calcium"]);
  });

  it("rejects a product assigned to the wrong category", () => {
    const invalid = structuredClone(unitPriceDatasetInput);
    invalid.categories[0].products[0].categorySlug = "vitamin-c";
    expect(validateUnitPriceDataset(invalid).success).toBe(false);
  });
});

describe("unit-price-v1 scoring", () => {
  it("includes set quantity and compares vitamin D per 10 ug", () => {
    const ranking = resolveUnitPriceRanking("vitamin-d", "2026-07-26");
    expect(ranking?.scores.map(({ product }) => product.id)).toEqual([
      "nutri-sun-d3-5000",
      "nutri-sun-d3-2000",
      "nutriday-plus-d-1000",
      "yuyu-haessaltoktok-d-1000",
    ]);
    expect(ranking?.scores[0].totalDays).toBe(180);
    expect(ranking?.scores[0].unitPriceKrw).toBeCloseTo(6.04, 2);
    expect(ranking?.scores[0].priceEfficiencyIndex).toBe(100);
    expect(ranking?.scores[1].priceEfficiencyIndex).toBeCloseTo(
      ranking!.scores[0].unitPriceKrw / ranking!.scores[1].unitPriceKrw * 100,
      5,
    );
  });

  it("includes mandatory shipping and units per day", () => {
    const ranking = resolveUnitPriceRanking("vitamin-c", "2026-07-26");
    const product = ranking?.scores.find(({ product }) => product.id === "korea-eundan-c-easy-d");
    expect(product?.totalDays).toBe(60);
    expect(product?.dailyCostKrw).toBeCloseTo(206.5, 2);
    expect(product?.unitPriceKrw).toBeCloseTo(20.65, 2);
  });

  it("ranks the expanded vitamin C pool by unit price", () => {
    const ranking = resolveUnitPriceRanking("vitamin-c", "2026-07-26");
    expect(ranking?.scores.map(({ product }) => product.id)).toEqual([
      "newmate-vitamin-c-1000",
      "ckd-vitamin-c-1000",
      "vitamin-village-mega-c-1000",
      "korea-eundan-c-1000",
      "korea-eundan-c-gold-powerup",
      "korea-eundan-c-neutral",
      "korea-eundan-c-easy-d",
    ]);
    expect(ranking?.scores[0].unitPriceKrw).toBeCloseTo(4.02, 2);
  });

  it("compares probiotics per one billion CFU", () => {
    const ranking = resolveUnitPriceRanking("probiotics", "2026-07-26");
    expect(ranking?.category.basisAmount).toBe(1_000_000_000);
    expect(ranking?.scores.every(({ product }) => product.activeUnit === "cfu")).toBe(true);
    expect(ranking?.scores.every(({ priceEfficiencyIndex }) => (
      priceEfficiencyIndex > 0 && priceEfficiencyIndex <= 100
    ))).toBe(true);
    expect(formatPriceEfficiency(ranking!.scores[0].priceEfficiencyIndex)).toBe("100점");
  });

  it("normalizes the best current offer to 100 within every category", () => {
    for (const category of unitPriceDataset.categories) {
      const ranking = resolveUnitPriceRanking(category.slug, "2026-07-26");
      expect(ranking?.scores).toHaveLength(category.products.length);
      expect(ranking?.scores[0].priceEfficiencyIndex).toBe(100);
      for (const score of ranking!.scores) {
        expect(score.priceEfficiencyIndex).toBeCloseTo(
          ranking!.scores[0].unitPriceKrw / score.unitPriceKrw * 100,
          5,
        );
      }
    }
  });

  it("does not compare products across categories", () => {
    expect(resolveUnitPriceRanking("multivitamin", "2026-07-26")).toBeNull();
    expect(resolveUnitPriceRanking("../calcium", "2026-07-26")).toBeNull();
  });

  it("excludes prices older than 30 days", () => {
    expect(resolveUnitPriceRanking("calcium", "2026-08-26")?.scores).toHaveLength(0);
  });
});
