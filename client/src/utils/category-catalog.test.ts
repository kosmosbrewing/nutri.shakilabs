import { describe, expect, it } from "vitest";
import { publicDataSnapshot } from "@/data/public-snapshot";
import {
  catalogCategories,
  categoryCards,
  categoryCatalog,
  findCategory,
  formatActiveAmount,
} from "./category-catalog";

describe("official supplement category catalog", () => {
  it("matches the tracked public snapshot", () => {
    expect(categoryCatalog.source).toEqual({
      datasetId: publicDataSnapshot.datasetId,
      dataReferenceDate: publicDataSnapshot.dataReferenceDate,
      sha256: publicDataSnapshot.sha256,
    });
  });

  it("exposes nine separate categories with diverse official samples", () => {
    expect(catalogCategories).toHaveLength(9);
    expect(new Set(catalogCategories.map((category) => category.slug)).size).toBe(9);
    for (const category of catalogCategories) {
      expect(category.records).toHaveLength(6);
      expect(new Set(category.records.map((record) => record.manufacturer)).size).toBe(6);
      expect(category.recordCount).toBeGreaterThanOrEqual(category.records.length);
    }
  });

  it("promotes every ranking-eligible category card to ranking status", () => {
    expect(categoryCards).toHaveLength(10);
    expect(categoryCards[0]).toMatchObject({
      slug: "multivitamin",
      count: 10,
      status: "ranking",
    });
    // 전 카테고리 순위화(2026-07-27) 이후: 검증 제품 4개+ 조건을 전부 충족
    expect(categoryCards.filter(({ status }) => status === "ranking").map(({ slug }) => slug)).toEqual([
      "multivitamin",
      "vitamin-d",
      "probiotics",
      "vitamin-c",
      "omega-3",
      "magnesium",
      "calcium",
      "msm",
      "coenzyme-q10",
      "milk-thistle",
    ]);
    expect(categoryCards.filter(({ status }) => status === "unit_price")).toHaveLength(0);
    expect(categoryCards.filter(({ status }) => status === "official_catalog")).toHaveLength(0);
  });

  it("parses route slugs and formats source amounts safely", () => {
    expect(findCategory("omega-3")?.name).toBe("오메가3");
    expect(findCategory(["omega-3"])).toBeNull();
    expect(findCategory("unknown")).toBeNull();
    expect(formatActiveAmount(12.5, "ug")).toBe("12.5 μg");
  });
});
