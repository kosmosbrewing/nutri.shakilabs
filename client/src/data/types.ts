export type NutrientUnit = "mg" | "ug";
export type ProductForm = "tablet" | "capsule" | "powder" | "liquid" | "gummy";
export type ConfidenceGrade = "A" | "B" | "C";
export type ProductStatus = "draft" | "rankable" | "stale" | "excluded";
export type NutrientPresence = "verified" | "absent" | "unknown";
export type SourceType =
  | "public_api"
  | "manufacturer_label"
  | "official_store"
  | "retailer";
export type ExtractionMethod = "api" | "text" | "manual" | "ocr";

export interface Product {
  id: string;
  slug: string;
  officialName: string;
  brand: string;
  manufacturer: string;
  reportNo: string;
  form: ProductForm;
  servingsPerDay: number;
  unitsPerServing: number;
  totalUnits: number;
  totalDays: number;
  confidence: ConfidenceGrade;
  status: ProductStatus;
  identitySourceId: string;
  labelSourceId: string;
}

export interface NutrientReference {
  id: string;
  name: string;
  canonicalUnit: NutrientUnit;
  dailyTarget: number;
  displayOrder: number;
  targetSourceId: string;
}

export interface ProductNutrient {
  productId: string;
  nutrientId: string;
  amountPerServing: number | null;
  canonicalUnit: NutrientUnit;
  originalValue: string;
  presence: NutrientPresence;
  sourceId: string;
}

export interface OfferSnapshot {
  id: string;
  productId: string;
  seller: string;
  listedPriceKrw: number;
  mandatoryShippingKrw: number;
  quantityMultiplier: number;
  capturedAt: string;
  url: string;
  affiliate: boolean;
  availability: "in_stock" | "out_of_stock";
  sourceId: string;
}

export interface SourceEvidence {
  id: string;
  productId: string | null;
  type: SourceType;
  title: string;
  url: string;
  verifiedAt: string;
  rawHash: string;
  extraction: ExtractionMethod;
  fields: string[];
}

export interface NutriDataset {
  schemaVersion: "nutri-data-v1";
  updatedAt: string;
  products: Product[];
  nutrientReferences: NutrientReference[];
  productNutrients: ProductNutrient[];
  offers: OfferSnapshot[];
  sources: SourceEvidence[];
}
