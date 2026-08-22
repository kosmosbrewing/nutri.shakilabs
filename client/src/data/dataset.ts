import type { NutriDataset } from "./types";
import { nutrientReferences } from "./nutrients";
import { offers } from "./offers";
import { PRICE_CAPTURED_AT } from "./price-freshness";
import { productNutrients } from "./product-nutrients";
import { products } from "./products";
import { sources } from "./sources";

export const nutriDataset: NutriDataset = {
  schemaVersion: "nutri-data-v1",
  updatedAt: PRICE_CAPTURED_AT,
  products,
  nutrientReferences,
  productNutrients,
  offers,
  sources,
};
