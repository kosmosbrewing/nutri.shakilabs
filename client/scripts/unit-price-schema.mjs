import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const unitSchema = z.enum(["mg", "ug"]);

const offerSchema = z.object({
  seller: z.string().trim().min(1),
  listedPriceKrw: z.number().int().positive(),
  mandatoryShippingKrw: z.number().int().nonnegative(),
  packageCount: z.number().int().positive(),
  capturedAt: dateSchema,
  url: z.url(),
  title: z.string().trim().min(1),
  affiliate: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock"]),
}).strict();

const productSchema = z.object({
  id: idSchema,
  categorySlug: idSchema,
  officialName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  servingLabel: z.string().trim().min(1),
  packageLabel: z.string().trim().min(1),
  dailyActiveAmount: z.number().positive(),
  activeUnit: unitSchema,
  totalUnitsPerPackage: z.number().int().positive(),
  unitsPerDay: z.number().positive(),
  confidence: z.enum(["A", "B"]),
  offer: offerSchema,
}).strict().refine((value) => Number.isInteger(
  value.totalUnitsPerPackage * value.offer.packageCount / value.unitsPerDay,
), { message: "Offer must resolve to whole days" });

const categorySchema = z.object({
  slug: idSchema,
  name: z.string().trim().min(1),
  activeName: z.string().trim().min(1),
  activeUnit: unitSchema,
  basisAmount: z.number().positive(),
  basisLabel: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  products: z.array(productSchema).length(3),
}).strict().superRefine((category, context) => {
  category.products.forEach((product, index) => {
    if (product.categorySlug !== category.slug || product.activeUnit !== category.activeUnit) {
      context.addIssue({ code: "custom", path: ["products", index], message: "Category or unit mismatch" });
    }
  });
});

export const unitPriceDatasetSchema = z.object({
  schemaVersion: z.literal("unit-price-v1"),
  updatedAt: dateSchema,
  source: z.object({
    datasetId: z.literal("15155983"),
    dataReferenceDate: dateSchema,
    url: z.url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  categories: z.array(categorySchema).length(3),
}).strict();
