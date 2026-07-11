export type UnitPriceUnit = "mg" | "ug" | "cfu";
export type UnitPriceConfidence = "A" | "B";

export interface UnitPriceOfferInput {
  seller: string;
  listedPriceKrw: number;
  mandatoryShippingKrw: number;
  packageCount: number;
  capturedAt: string;
  url: string;
  title: string;
  affiliate: boolean;
  availability: "in_stock" | "out_of_stock";
}

export interface UnitPriceProductInput {
  id: string;
  categorySlug: string;
  officialName: string;
  displayName: string;
  brand: string;
  manufacturer: string;
  reportNo: string;
  officialSourceUrl: string;
  servingLabel: string;
  packageLabel: string;
  dailyActiveAmount: number;
  activeUnit: UnitPriceUnit;
  totalUnitsPerPackage: number;
  unitsPerDay: number;
  confidence: UnitPriceConfidence;
  offer: UnitPriceOfferInput;
}

export interface UnitPriceCategoryInput {
  slug: string;
  name: string;
  activeName: string;
  activeUnit: UnitPriceUnit;
  basisAmount: number;
  basisLabel: string;
  summary: string;
  products: UnitPriceProductInput[];
}

export interface UnitPriceDatasetInput {
  schemaVersion: "unit-price-v1";
  updatedAt: string;
  source: {
    datasetId: "15155983";
    dataReferenceDate: string;
    url: string;
    sha256: string;
  };
  categories: UnitPriceCategoryInput[];
}
