import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { scoreProduct } from "./scoring";
import { validateDataset } from "./validation";

describe("curated launch dataset", () => {
  it("passes the external evidence schema", () => {
    const result = validateDataset(nutriDataset);
    expect(result.success, result.success ? "" : result.error.message).toBe(true);
  });

  it("contains ten A or B rankable products", () => {
    expect(nutriDataset.products).toHaveLength(10);
    expect(nutriDataset.products.every((product) =>
      product.status === "rankable" && ["A", "B"].includes(product.confidence),
    )).toBe(true);
  });

  it("has exactly one non-unknown row for every target nutrient", () => {
    for (const product of nutriDataset.products) {
      const rows = nutriDataset.productNutrients.filter((item) => item.productId === product.id);
      expect(rows).toHaveLength(nutriDataset.nutrientReferences.length);
      expect(rows.every((item) => item.presence !== "unknown")).toBe(true);
      expect(new Set(rows.map((item) => item.nutrientId)).size).toBe(rows.length);
    }
  });

  it("scores every product with a fresh, non-affiliate offer", () => {
    for (const product of nutriDataset.products) {
      const offer = nutriDataset.offers.find((item) => item.productId === product.id);
      expect(offer).toBeDefined();
      expect(offer?.affiliate).toBe(false);
      if (!offer) continue;
      const result = scoreProduct({
        product,
        references: nutriDataset.nutrientReferences,
        nutrients: nutriDataset.productNutrients.filter((item) => item.productId === product.id),
        offer,
        asOf: nutriDataset.updatedAt,
      });
      expect(result.success, result.success ? "" : result.detail).toBe(true);
    }
  });
});
