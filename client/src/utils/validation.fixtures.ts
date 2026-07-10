import type {
  NutriDataset,
  NutrientReference,
  OfferSnapshot,
  Product,
  ProductNutrient,
  SourceEvidence,
} from "@/data/types";

export const validProduct: Product = {
  id: "sample-one",
  slug: "sample-one",
  officialName: "샘플 멀티비타민",
  brand: "샘플",
  manufacturer: "샘플 제조",
  reportNo: "200400000001",
  form: "tablet",
  servingsPerDay: 1,
  unitsPerServing: 1,
  totalUnits: 60,
  totalDays: 60,
  confidence: "A",
  status: "rankable",
  identitySourceId: "source-public",
  labelSourceId: "source-label",
};

export const validReference: NutrientReference = {
  id: "vitamin-c",
  name: "비타민 C",
  canonicalUnit: "mg",
  dailyTarget: 100,
  displayOrder: 1,
  targetSourceId: "source-public",
};

export const validNutrient: ProductNutrient = {
  productId: "sample-one",
  nutrientId: "vitamin-c",
  amountPerServing: 100,
  canonicalUnit: "mg",
  originalValue: "100 mg",
  presence: "verified",
  sourceId: "source-label",
};

export const validOffer: OfferSnapshot = {
  id: "offer-sample-one",
  productId: "sample-one",
  seller: "공식몰",
  listedPriceKrw: 12000,
  mandatoryShippingKrw: 0,
  quantityMultiplier: 1,
  capturedAt: "2026-07-10",
  url: "https://example.com/sample-one",
  affiliate: false,
  availability: "in_stock",
  sourceId: "source-price",
};

const hash = `sha256:${"a".repeat(64)}`;

export const validSources: SourceEvidence[] = [
  {
    id: "source-public",
    productId: "sample-one",
    type: "public_api",
    title: "공공 제품 정보",
    url: "https://example.com/public",
    verifiedAt: "2026-07-10",
    rawHash: hash,
    extraction: "api",
    fields: ["reportNo", "officialName"],
  },
  {
    id: "source-label",
    productId: "sample-one",
    type: "manufacturer_label",
    title: "제조사 영양 라벨",
    url: "https://example.com/label",
    verifiedAt: "2026-07-10",
    rawHash: hash,
    extraction: "text",
    fields: ["nutrients", "totalUnits"],
  },
  {
    id: "source-price",
    productId: "sample-one",
    type: "official_store",
    title: "공식몰 판매 정보",
    url: "https://example.com/offer",
    verifiedAt: "2026-07-10",
    rawHash: hash,
    extraction: "manual",
    fields: ["price", "shipping"],
  },
];

export const validDataset: NutriDataset = {
  schemaVersion: "nutri-data-v1",
  updatedAt: "2026-07-10",
  products: [validProduct],
  nutrientReferences: [validReference],
  productNutrients: [validNutrient],
  offers: [validOffer],
  sources: validSources,
};
