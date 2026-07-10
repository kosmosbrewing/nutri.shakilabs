import { describe, expect, it } from "vitest";
import { parseComparisonIds } from "./comparison";

const validIds = ["alpha-30", "beta-60", "gamma-90", "delta-10", "epsilon-20"];

describe("comparison query validation", () => {
  it("accepts two to four unique known IDs", () => {
    expect(parseComparisonIds("alpha-30,beta-60,alpha-30", validIds)).toEqual({
      success: true,
      ids: ["alpha-30", "beta-60"],
    });
  });

  it("rejects fewer than two or more than four IDs", () => {
    expect(parseComparisonIds("alpha-30", validIds).success).toBe(false);
    expect(parseComparisonIds(validIds.join(","), validIds).success).toBe(false);
  });

  it("rejects unknown or malformed IDs", () => {
    expect(parseComparisonIds("alpha-30,unknown-1", validIds).success).toBe(false);
    expect(parseComparisonIds("alpha-30,<script>", validIds).success).toBe(false);
  });
});
