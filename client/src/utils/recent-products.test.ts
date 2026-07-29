import { describe, expect, it } from "vitest";
import { parseRecentIds, pushRecentId, RECENT_PRODUCTS_MAX } from "./recent-products";

const validIds = ["alpha-1", "beta-2", "gamma-3", "delta-4", "epsilon-5", "zeta-6"];

describe("recent products storage", () => {
  it("parses only known ids and tolerates garbage", () => {
    expect(parseRecentIds(JSON.stringify(["beta-2", "ghost-9", "alpha-1"]), validIds))
      .toEqual(["beta-2", "alpha-1"]);
    expect(parseRecentIds("not-json{", validIds)).toEqual([]);
    expect(parseRecentIds(JSON.stringify({ id: "alpha-1" }), validIds)).toEqual([]);
    expect(parseRecentIds(null, validIds)).toEqual([]);
  });

  it("keeps the newest visit first without duplicates, capped at the max", () => {
    let ids: string[] = [];
    for (const id of ["alpha-1", "beta-2", "alpha-1", "gamma-3", "delta-4", "epsilon-5", "zeta-6"]) {
      ids = pushRecentId(ids, id);
    }
    expect(ids).toHaveLength(RECENT_PRODUCTS_MAX);
    // alpha-1 was revisited mid-sequence, so beta-2 is the one evicted by the cap
    expect(ids).toEqual(["zeta-6", "epsilon-5", "delta-4", "gamma-3", "alpha-1"]);
  });
});
