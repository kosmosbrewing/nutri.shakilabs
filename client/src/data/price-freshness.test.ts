import { describe, expect, it, vi } from "vitest";
import freshnessPolicy from "./freshness.json";
import {
  OVERDUE_AFTER_DAYS,
  OVERDUE_BEHAVIOR,
  PRICE_AS_OF,
  PRICE_CAPTURED_AT,
  REFRESH_REQUIRED_AFTER_DAYS,
  priceFreshnessNoticeBody,
  priceFreshnessRules,
} from "./price-freshness";
import unitPriceDataset from "./unit-price-products.json";
import { nutriDataset } from "./dataset";

describe("published price freshness policy", () => {
  it("is the single source every dated price artefact reconciles to", () => {
    expect(nutriDataset.updatedAt).toBe(PRICE_CAPTURED_AT);
    expect(unitPriceDataset.updatedAt).toBe(PRICE_CAPTURED_AT);
    for (const offer of nutriDataset.offers) {
      expect(offer.capturedAt).toBe(PRICE_CAPTURED_AT);
    }
    for (const category of unitPriceDataset.categories) {
      for (const product of category.products) {
        expect(product.offer.capturedAt).toBe(PRICE_CAPTURED_AT);
      }
    }
  });

  it("evaluates freshness against a date that can actually move", async () => {
    // The defect being fixed: asOf was the dataset's own updatedAt, so the age was
    // structurally pinned at 0 and no published boundary could ever be crossed.
    // 예전 검사(asOf ≠ capturedAt)는 값으로 구조를 추정해, 같은 날 전량 재확인한 정상 상태
    // (2026-10-03: capturedAt = asOf)를 결함으로 오판한다. 그래서 날짜가 실제로 움직이는지를 잰다:
    // 커밋 기본값은 freshness.json의 asOf, capturedAt 이후 빌드 주입일이면 그 날짜로 옮겨 가고,
    // capturedAt 이전 주입일은 무시된다.
    expect(PRICE_AS_OF >= PRICE_CAPTURED_AT).toBe(true);
    try {
      vi.stubEnv("VITE_NUTRI_PRICE_AS_OF", "2099-01-01");
      vi.resetModules();
      expect((await import("./price-freshness")).PRICE_AS_OF).toBe("2099-01-01");
      vi.stubEnv("VITE_NUTRI_PRICE_AS_OF", "2000-01-01");
      vi.resetModules();
      expect((await import("./price-freshness")).PRICE_AS_OF).toBe(freshnessPolicy.asOf);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("publishes boundaries that match the thresholds the ranking code uses", () => {
    const terms = Object.fromEntries(priceFreshnessRules.map((rule) => [rule.id, rule.term]));
    expect(terms.fresh).toBe(`0~${REFRESH_REQUIRED_AFTER_DAYS}일`);
    expect(terms.refresh_required).toBe(`${REFRESH_REQUIRED_AFTER_DAYS + 1}~${OVERDUE_AFTER_DAYS}일`);
    expect(terms.overdue).toBe(`${OVERDUE_AFTER_DAYS + 1}일 이상`);
  });

  it("describes the overdue behaviour it actually implements", () => {
    const overdue = priceFreshnessRules.find((rule) => rule.id === "overdue");
    expect(overdue).toBeDefined();
    if (OVERDUE_BEHAVIOR === "grace") {
      expect(overdue?.detail).toContain("유예");
      expect(overdue?.detail).not.toContain("제외");
      expect(priceFreshnessNoticeBody("overdue", 40)).toContain("유예");
    } else {
      expect(overdue?.detail).toContain("제외");
      expect(overdue?.detail).not.toContain("유예");
    }
  });

  it("states the measured age in the notice a reader can check against the capture date", () => {
    expect(priceFreshnessNoticeBody("refresh_required", 24)).toContain("24일");
    expect(priceFreshnessNoticeBody("overdue", 40)).toContain("40일");
  });
});
