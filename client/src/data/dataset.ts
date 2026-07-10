import type { NutriDataset } from "./types";
import { nutrientReferences } from "./nutrients";
import { offers } from "./offers";
import { productNutrients } from "./product-nutrients";
import { products } from "./products";
import { sources } from "./sources";

export const nutriDataset: NutriDataset = {
  schemaVersion: "nutri-data-v1",
  updatedAt: "2026-07-10",
  products,
  nutrientReferences,
  productNutrients,
  offers,
  sources,
};
