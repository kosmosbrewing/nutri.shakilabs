import { z } from "zod";

export const foodSafetyKeySchema = z.string()
  .trim()
  .min(10)
  .max(128)
  .regex(/^[A-Za-z0-9]+$/, "KR_FOOD_DAT must be an alphanumeric FoodSafety Korea key");

export const foodSafetyServiceSchema = z.enum(["I0030", "C003"]);

const resultSchema = z.object({
  MSG: z.string(),
  CODE: z.string(),
}).passthrough();

const servicePayloadSchema = z.object({
  total_count: z.coerce.number().int().nonnegative(),
  RESULT: resultSchema,
  row: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export function parseFoodSafetyEnvelope(serviceInput, input) {
  const serviceResult = foodSafetyServiceSchema.safeParse(serviceInput);
  if (!serviceResult.success) {
    throw new Error(`FoodSafety service validation failed: ${z.prettifyError(serviceResult.error)}`);
  }
  const rootResult = z.record(z.string(), z.unknown()).safeParse(input);
  if (!rootResult.success) {
    throw new Error(`FoodSafety response validation failed: ${z.prettifyError(rootResult.error)}`);
  }
  const payloadResult = servicePayloadSchema.safeParse(rootResult.data[serviceResult.data]);
  if (!payloadResult.success) {
    throw new Error(`FoodSafety ${serviceResult.data} payload validation failed: ${z.prettifyError(payloadResult.error)}`);
  }
  return payloadResult.data;
}

export const foodSafetyManifestSchema = z.object({
  schemaVersion: z.literal("food-safety-snapshot-v1"),
  downloadedAt: z.string().datetime(),
  dataReferenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  services: z.array(z.object({
    serviceId: foodSafetyServiceSchema,
    sourceUrl: z.url(),
    rawFile: z.string().regex(/^raw\/food-safety-(I0030|C003)-\d{4}-\d{2}-\d{2}\.json$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    rowCount: z.number().int().nonnegative(),
  }).strict()).length(2),
}).strict();
