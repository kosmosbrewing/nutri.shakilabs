import { z } from "zod";
import type {
  NutriDataset,
  NutrientReference,
  OfferSnapshot,
  Product,
  ProductNutrient,
  SourceEvidence,
} from "@/data/types";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  },
  "Invalid calendar date",
);
const unitSchema = z.enum(["mg", "ug"]);

export const productSchema = z.object({
  id: idSchema,
  slug: idSchema,
  officialName: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  form: z.enum(["tablet", "capsule", "powder", "liquid", "gummy"]),
  servingsPerDay: z.number().int().positive(),
  unitsPerServing: z.number().int().positive(),
  totalUnits: z.number().int().positive(),
  totalDays: z.number().int().positive(),
  confidence: z.enum(["A", "B", "C"]),
  status: z.enum(["draft", "rankable", "stale", "excluded"]),
  identitySourceId: idSchema,
  labelSourceId: idSchema,
}).strict();

export const nutrientReferenceSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  canonicalUnit: unitSchema,
  dailyTarget: z.number().positive(),
  displayOrder: z.number().int().nonnegative(),
  targetSourceId: idSchema,
}).strict();

export const productNutrientSchema = z.object({
  productId: idSchema,
  nutrientId: idSchema,
  amountPerServing: z.number().nonnegative().nullable(),
  canonicalUnit: unitSchema,
  originalValue: z.string().trim().min(1),
  presence: z.enum(["verified", "absent", "unknown"]),
  sourceId: idSchema,
}).strict().superRefine((value, context) => {
  const valid = value.presence === "unknown"
    ? value.amountPerServing === null
    : value.amountPerServing !== null;
  if (!valid) {
    context.addIssue({
      code: "custom",
      path: ["amountPerServing"],
      message: "Presence and amount do not match",
    });
  }
  if (value.presence === "absent" && value.amountPerServing !== 0) {
    context.addIssue({
      code: "custom",
      path: ["amountPerServing"],
      message: "Absent nutrients must have a zero amount",
    });
  }
});

export const offerSnapshotSchema = z.object({
  id: idSchema,
  productId: idSchema,
  seller: z.string().trim().min(1),
  listedPriceKrw: z.number().int().nonnegative(),
  mandatoryShippingKrw: z.number().int().nonnegative(),
  quantityMultiplier: z.number().int().positive(),
  capturedAt: dateSchema,
  url: z.url(),
  affiliate: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock"]),
  sourceId: idSchema,
}).strict();

export const sourceEvidenceSchema = z.object({
  id: idSchema,
  productId: idSchema.nullable(),
  type: z.enum(["public_api", "manufacturer_label", "official_store", "retailer"]),
  title: z.string().trim().min(1),
  url: z.url(),
  verifiedAt: dateSchema,
  rawHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  extraction: z.enum(["api", "text", "manual", "ocr"]),
  fields: z.array(z.string().trim().min(1)).min(1),
}).strict();

const baseDatasetSchema = z.object({
  schemaVersion: z.literal("nutri-data-v1"),
  updatedAt: dateSchema,
  products: z.array(productSchema),
  nutrientReferences: z.array(nutrientReferenceSchema),
  productNutrients: z.array(productNutrientSchema),
  offers: z.array(offerSnapshotSchema),
  sources: z.array(sourceEvidenceSchema),
}).strict();

function duplicateIds(values: { id: string }[]): string[] {
  const seen = new Set<string>();
  return values.map(({ id }) => id).filter((id) => seen.has(id) || !seen.add(id));
}

export const nutriDatasetSchema = baseDatasetSchema.superRefine((data, context) => {
  const products = new Set(data.products.map(({ id }) => id));
  const nutrients = new Set(data.nutrientReferences.map(({ id }) => id));
  const sources = new Set(data.sources.map(({ id }) => id));
  const duplicateGroups = [data.products, data.nutrientReferences, data.offers, data.sources];
  if (duplicateGroups.some((group) => duplicateIds(group).length > 0)) {
    context.addIssue({ code: "custom", message: "Dataset IDs must be unique" });
  }
  for (const product of data.products) {
    if (!sources.has(product.identitySourceId) || !sources.has(product.labelSourceId)) {
      context.addIssue({ code: "custom", message: `Missing product source: ${product.id}` });
    }
  }
  for (const reference of data.nutrientReferences) {
    if (!sources.has(reference.targetSourceId)) {
      context.addIssue({ code: "custom", message: `Missing target source: ${reference.id}` });
    }
  }
  for (const item of data.productNutrients) {
    if (!products.has(item.productId) || !nutrients.has(item.nutrientId) || !sources.has(item.sourceId)) {
      context.addIssue({ code: "custom", message: `Invalid nutrient reference: ${item.productId}` });
    }
  }
  for (const offer of data.offers) {
    if (!products.has(offer.productId) || !sources.has(offer.sourceId)) {
      context.addIssue({ code: "custom", message: `Invalid offer reference: ${offer.id}` });
    }
  }
});

export const validateProduct = (input: unknown) => productSchema.safeParse(input);
export const validateNutrient = (input: unknown) => productNutrientSchema.safeParse(input);
export const validateOffer = (input: unknown) => offerSnapshotSchema.safeParse(input);
export const validateSource = (input: unknown) => sourceEvidenceSchema.safeParse(input);
export const validateDataset = (input: unknown) => nutriDatasetSchema.safeParse(input);

export type ValidatedProduct = z.infer<typeof productSchema> & Product;
export type ValidatedNutrient = z.infer<typeof productNutrientSchema> & ProductNutrient;
export type ValidatedOffer = z.infer<typeof offerSnapshotSchema> & OfferSnapshot;
export type ValidatedSource = z.infer<typeof sourceEvidenceSchema> & SourceEvidence;
export type ValidatedReference = z.infer<typeof nutrientReferenceSchema> & NutrientReference;
export type ValidatedDataset = z.infer<typeof nutriDatasetSchema> & NutriDataset;
