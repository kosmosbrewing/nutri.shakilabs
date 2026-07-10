import { z } from "zod";

export const portalHeaderSchema = z.object({
  fileName: z.string().min(1),
  columList: z.array(z.object({
    columCode: z.string().min(1),
    columNm: z.string().min(1),
  })).min(1),
  tableVO: z.object({
    svcTableNm: z.string().min(1),
    colNmList: z.array(z.string().min(1)).min(1),
  }),
  totalCount: z.number().int().positive(),
});

export const rawSnapshotSchema = z.object({
  fields: z.array(z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  })).min(1),
  records: z.array(z.record(z.string(), z.unknown())).min(1),
});

export const portalRecordsSchema = z.array(z.record(z.string(), z.unknown()));

export const manifestSchema = z.object({
  schemaVersion: z.literal("public-snapshot-v1"),
  datasetId: z.literal("15155983"),
  datasetName: z.string().min(1),
  sourceUrl: z.url(),
  downloadedAt: z.string().datetime(),
  dataReferenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rawFile: z.string().regex(/^raw\/[a-z0-9-]+\.json$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  rowCount: z.number().int().positive(),
  columnCount: z.number().int().positive(),
});

export function parseJsonResponse(schema, input, label) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`${label} validation failed: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
