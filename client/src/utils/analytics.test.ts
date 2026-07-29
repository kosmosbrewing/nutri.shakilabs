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

  it("accepts live navigation and retention events end to end", () => {
    // SiteHeader·HomeView가 실제로 보내는 페이로드 — 스키마 누락으로 조용히 버려졌던 회귀 방지
    expect(parseAnalyticsEvent({
      name: "nav_click",
      to_tool: "vitamin-d",
      placement: "primary_nav",
    }).success).toBe(true);
    expect(parseAnalyticsEvent({ name: "ranking_expand", filter_name: "show_all" }).success).toBe(true);
    expect(parseAnalyticsEvent({
      name: "related_tool_click",
      from_tool: "compare",
      to_tool: "centrum-men-50",
      placement: "compare_header",
    }).success).toBe(true);
    expect(parseAnalyticsEvent({
      name: "related_tool_click",
      from_tool: "vitamin-d",
      to_tool: "omega-3",
      placement: "category_quicklinks",
    }).success).toBe(true);
    expect(parseAnalyticsEvent({
      name: "nav_click",
      to_tool: "vitamin-d",
      placement: "unknown_spot",
    }).success).toBe(false);
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
