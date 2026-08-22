import { describe, expect, it } from "vitest";
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

  it("evaluates freshness against a date that can actually move", () => {
    // The defect being fixed: asOf was the dataset's own updatedAt, so the age was
    // structurally pinned at 0 and no published boundary could ever be crossed.
    expect(PRICE_AS_OF >= PRICE_CAPTURED_AT).toBe(true);
    expect(PRICE_AS_OF).not.toBe(PRICE_CAPTURED_AT);
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
