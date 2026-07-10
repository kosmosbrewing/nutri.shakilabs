import { describe, expect, it } from "vitest";
import type { ProductScore } from "./scoring";
import {
  calculateDailyCost,
  convertAmount,
  getPriceFreshness,
  rankScores,
  scoreProduct,
} from "./scoring";
import { makeNutrients, makeProduct, makeReferences } from "./scoring.fixtures";
import { validNutrient, validOffer, validReference } from "./validation.fixtures";

describe("value-v1 scoring", () => {
  it("caps nutrient coverage at 100 percent", () => {
    const product = makeProduct();
    const references = makeReferences(4);
    const result = scoreProduct({
      product,
      references,
      nutrients: makeNutrients(product.id, [0, 0.5, 1, 3], references),
      offer: validOffer,
      asOf: "2026-07-10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.score.coverage.map(({ ratio }) => ratio)).toEqual([0, 0.5, 1, 1]);
      expect(result.score.coverageScore).toBe(62.5);
    }
  });

  it("converts mg and ug but rejects unsupported units", () => {
    expect(convertAmount(1, "mg", "ug")).toBe(1000);
    expect(convertAmount(1000, "ug", "mg")).toBe(1);
    expect(() => convertAmount(1, "mg", "IU" as "mg")).toThrow(/Unsupported/);
  });

  it("includes shipping and package multiplier in daily cost", () => {
    const product = makeProduct({ totalDays: 60 });
    const offer = { ...validOffer, listedPriceKrw: 9000, mandatoryShippingKrw: 3000, quantityMultiplier: 2 };
    expect(calculateDailyCost(product, offer)).toBe(100);
  });

  it("rejects unknown values while accepting verified absence", () => {
    const product = makeProduct();
    const unknown = scoreProduct({
      product,
      references: [validReference],
      nutrients: [{ ...validNutrient, presence: "unknown", amountPerServing: null }],
      offer: validOffer,
      asOf: "2026-07-10",
    });
    const absent = scoreProduct({
      product,
      references: [validReference],
      nutrients: [{ ...validNutrient, presence: "absent", amountPerServing: 0 }],
      offer: validOffer,
      asOf: "2026-07-10",
    });
    expect(unknown).toMatchObject({ success: false, reason: "unknown_nutrient" });
    expect(absent.success).toBe(true);
  });

  it("applies 14-day and 30-day price boundaries", () => {
    expect(getPriceFreshness("2026-06-26", "2026-07-10")).toBe("fresh");
    expect(getPriceFreshness("2026-06-25", "2026-07-10")).toBe("refresh_required");
    expect(getPriceFreshness("2026-06-10", "2026-07-10")).toBe("refresh_required");
    expect(getPriceFreshness("2026-06-09", "2026-07-10")).toBe("stale");
  });

  it("recalculates the two report examples under value-v1", () => {
    const firstProduct = makeProduct({ id: "report-one", totalDays: 60 });
    const firstRefs = makeReferences(21);
    const first = scoreProduct({
      product: firstProduct,
      references: firstRefs,
      nutrients: makeNutrients(firstProduct.id, Array(21).fill(1), firstRefs),
      offer: { ...validOffer, productId: firstProduct.id, listedPriceKrw: 8230 },
      asOf: "2026-07-10",
    });
    const secondProduct = makeProduct({ id: "report-two", totalDays: 60 });
    const secondRefs = makeReferences(22);
    const second = scoreProduct({
      product: secondProduct,
      references: secondRefs,
      nutrients: makeNutrients(secondProduct.id, [...Array(18).fill(1), 0.5, 0, 0, 0], secondRefs),
      offer: { ...validOffer, productId: secondProduct.id, listedPriceKrw: 21900 },
      asOf: "2026-07-10",
    });
    expect(first.success && first.score.dailyCostKrw).toBeCloseTo(137.17, 2);
    expect(first.success && first.score.valueIndex).toBeCloseTo(72.9, 1);
    expect(second.success && second.score.coverageScore).toBeCloseTo(84.09, 2);
    expect(second.success && second.score.valueIndex).toBeCloseTo(23.04, 2);
  });
});

describe("ranking tie breakers", () => {
  const base: ProductScore = {
    productId: "b",
    productName: "나 제품",
    confidence: "B",
    capturedAt: "2026-07-09",
    scoreVersion: "value-v1",
    coverageScore: 100,
    dailyCostKrw: 100,
    monthlyCostKrw: 3000,
    valueIndex: 100,
    freshness: "fresh",
    coverage: [],
  };

  it("sorts by value, confidence, recency, then Korean name", () => {
    const scores = [
      base,
      { ...base, productId: "a", productName: "가 제품", confidence: "A" as const },
      { ...base, productId: "high", valueIndex: 101 },
    ];
    expect(rankScores(scores).map(({ productId }) => productId)).toEqual(["high", "a", "b"]);
  });
});
