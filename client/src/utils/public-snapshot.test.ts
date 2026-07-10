import { describe, expect, it } from "vitest";
import { z } from "zod";
import { publicDataSnapshot } from "@/data/public-snapshot";
import manifest from "../../../data/manifests/latest.json";

const manifestSchema = z.object({
  datasetId: z.string(),
  dataReferenceDate: z.string(),
  sha256: z.string().length(64),
  rowCount: z.number().int().positive(),
  columnCount: z.number().int().positive(),
}).passthrough();

describe("public snapshot display metadata", () => {
  it("matches the tracked source manifest", () => {
    const parsed = manifestSchema.safeParse(manifest);
    expect(parsed.success, parsed.success ? "" : parsed.error.message).toBe(true);
    if (!parsed.success) return;
    expect(publicDataSnapshot).toMatchObject(parsed.data);
  });
});
