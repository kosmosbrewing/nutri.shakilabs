import { describe, expect, it } from "vitest";
import {
  validateDataset,
  validateNutrient,
  validateOffer,
  validateProduct,
  validateSource,
} from "./validation";
import {
  validDataset,
  validNutrient,
  validOffer,
  validProduct,
  validSources,
} from "./validation.fixtures";

describe("public data validation", () => {
  it("safe parses each external entity", () => {
    expect(validateProduct(validProduct).success).toBe(true);
    expect(validateNutrient(validNutrient).success).toBe(true);
    expect(validateOffer(validOffer).success).toBe(true);
    expect(validateSource(validSources[0]).success).toBe(true);
  });

  it("rejects unsupported nutrient units", () => {
    expect(validateNutrient({ ...validNutrient, canonicalUnit: "IU" }).success).toBe(false);
  });

  it("keeps unknown values distinct from zero", () => {
    const unknownWithZero = { ...validNutrient, presence: "unknown", amountPerServing: 0 };
    const absentWithNull = { ...validNutrient, presence: "absent", amountPerServing: null };
    expect(validateNutrient(unknownWithZero).success).toBe(false);
    expect(validateNutrient(absentWithNull).success).toBe(false);
  });

  it("rejects negative prices and malformed dates", () => {
    expect(validateOffer({ ...validOffer, listedPriceKrw: -1 }).success).toBe(false);
    expect(validateOffer({ ...validOffer, capturedAt: "2026-02-31" }).success).toBe(false);
  });

  it("validates cross-entity references", () => {
    expect(validateDataset(validDataset).success).toBe(true);
    const broken = {
      ...validDataset,
      offers: [{ ...validOffer, sourceId: "missing-source" }],
    };
    expect(validateDataset(broken).success).toBe(false);
  });
});
