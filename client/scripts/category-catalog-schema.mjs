import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

export const categoryRecordSchema = z.object({
  name: z.string().trim().min(1),
  manufacturer: z.string().trim().min(1),
  reportNo: z.string().trim().min(1),
  servingSize: z.string().trim().min(1),
  dailyFrequency: z.string().trim().min(1),
  dataCreatedAt: dateSchema,
  activeAmount: z.number().nonnegative().nullable(),
}).strict();

export const categoryCatalogSchema = z.object({
  schemaVersion: z.literal("category-catalog-v1"),
  source: z.object({
    datasetId: z.literal("15155983"),
    dataReferenceDate: dateSchema,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  categories: z.array(z.object({
    slug: slugSchema,
    name: z.string().trim().min(1),
    datasetLabel: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    comparisonBasis: z.string().trim().min(1),
    analysisState: z.enum(["amount_in_snapshot", "identity_only"]),
    activeUnit: z.enum(["mg", "ug"]).nullable(),
    recordCount: z.number().int().positive(),
    nextEvidence: z.array(z.string().trim().min(1)).min(2),
    records: z.array(categoryRecordSchema).length(6),
  }).strict().superRefine((category, context) => {
    const hasAmount = category.records.some((record) => record.activeAmount !== null);
    if ((category.activeUnit === null) === hasAmount) {
      context.addIssue({ code: "custom", message: "Active unit and values must agree" });
    }
    if (category.recordCount < category.records.length) {
      context.addIssue({ code: "custom", message: "Sample exceeds category record count" });
    }
  })).length(9),
}).strict();
