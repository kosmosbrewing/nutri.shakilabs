import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
export const expansionCategorySchema = z.enum([
  "probiotics",
  "omega-3",
  "magnesium",
  "msm",
  "coenzyme-q10",
  "milk-thistle",
]);

const offerSchema = z.object({
  seller: z.string().trim().min(1),
  listedPriceKrw: z.number().int().positive(),
  mandatoryShippingKrw: z.number().int().nonnegative(),
  packageCount: z.number().int().positive(),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.url(),
  title: z.string().trim().min(1),
  affiliate: z.literal(false),
  availability: z.literal("in_stock"),
}).strict();

const productOfferSchema = z.object({
  productId: idSchema,
  displayName: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  servingLabel: z.string().trim().min(1),
  packageLabel: z.string().trim().min(1),
  totalUnitsPerPackage: z.number().int().positive(),
  unitsPerDay: z.number().int().positive(),
  confidence: z.enum(["A", "B"]),
  offer: offerSchema,
}).strict();

export const categoryOfferFileSchema = z.object({
  categorySlug: expansionCategorySchema,
  products: z.array(productOfferSchema).length(3),
}).strict();
