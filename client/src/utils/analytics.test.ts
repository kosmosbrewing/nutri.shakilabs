import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAnalyticsEventCommand,
  disableAnalytics,
  parseAnalyticsEvent,
  sanitizePageUrl,
} from "./analytics";

afterEach(() => vi.unstubAllGlobals());

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

  it("builds gtag commands without URL query or hash state", () => {
    expect(buildAnalyticsEventCommand(
      { name: "page_view", route: "/compare" },
      "https://shakilabs.com/nutri/compare?ids=one,two#table",
    )).toEqual([
      "event",
      "page_view",
      {
        route: "/compare",
        page_location: "https://shakilabs.com/nutri/compare",
        page_path: "/nutri/compare",
      },
    ]);
  });

  it("rejects invalid page URLs at the analytics boundary", () => {
    expect(sanitizePageUrl("not-a-url")).toBeNull();
    expect(buildAnalyticsEventCommand({ name: "page_view", route: "/" }, "not-a-url"))
      .toBeNull();
  });

  it("stops an already loaded tag when consent is withdrawn", () => {
    const analyticsWindow = { dataLayer: [["event", "page_view"]] };
    vi.stubGlobal("window", analyticsWindow);

    expect(disableAnalytics("G-TEST123")).toBe(true);
    expect((analyticsWindow as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);
    expect(analyticsWindow.dataLayer).toEqual([]);
  });
});
