import type { NutrientReference, Product, ProductNutrient } from "@/data/types";
import { validNutrient, validProduct, validReference } from "./validation.fixtures";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return { ...validProduct, ...overrides };
}

export function makeReferences(count: number): NutrientReference[] {
  return Array.from({ length: count }, (_, index) => ({
    ...validReference,
    id: `nutrient-${index + 1}`,
    name: `영양소 ${index + 1}`,
    dailyTarget: 100,
    displayOrder: index + 1,
  }));
}

export function makeNutrients(
  productId: string,
  ratios: number[],
  references = makeReferences(ratios.length),
): ProductNutrient[] {
  return ratios.map((ratio, index) => ({
    ...validNutrient,
    productId,
    nutrientId: references[index].id,
    amountPerServing: references[index].dailyTarget * ratio,
    canonicalUnit: references[index].canonicalUnit,
    originalValue: `${references[index].dailyTarget * ratio} ${references[index].canonicalUnit}`,
    presence: ratio === 0 ? "absent" : "verified",
  }));
}
