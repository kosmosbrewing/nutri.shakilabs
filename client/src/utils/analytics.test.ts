import { describe, expect, it } from "vitest";
import { parseAnalyticsEvent } from "./analytics";

describe("privacy-safe analytics events", () => {
  it("accepts bounded event payloads", () => {
    expect(parseAnalyticsEvent({
      name: "ranking_view",
      category: "multivitamin",
      score_version: "value-v1",
    }).success).toBe(true);
    expect(parseAnalyticsEvent({ name: "compare_view", product_count: 4 }).success).toBe(true);
  });

  it("rejects raw filter values and out-of-range comparison counts", () => {
    expect(parseAnalyticsEvent({
      name: "filter_apply",
      filter_name: "budget",
      budget_value: 10_000,
    }).success).toBe(false);
    expect(parseAnalyticsEvent({ name: "compare_view", product_count: 5 }).success).toBe(false);
  });

  it("rejects health and identity fields", () => {
    expect(parseAnalyticsEvent({
      name: "page_view",
      route: "/products/example",
      medication: "example drug",
    }).success).toBe(false);
  });
});
