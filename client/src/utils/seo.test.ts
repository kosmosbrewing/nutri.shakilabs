import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { nutrientReferences } from "@/data/nutrients";
import { seoStaticPages } from "@/data/seo-static-pages";
// @ts-expect-error — 산출물 게이트 규칙은 .mjs다(다른 테스트도 같은 방식으로 붙는다)
import * as builtTitleRules from "../../scripts/seo-title-rules.mjs";
import { catalogCategories } from "./category-catalog";
import { categoryTitleBasis } from "./category-seo";
import { buildHeadTags, resolveSeoPage } from "./seo";
import {
  APP_TITLE_NAME,
  BRAND_TITLE_SUFFIX,
  FORBIDDEN_META_WORDS,
  siteTitle,
} from "./seo-title";
import { isRankingEligible, resolveUnitPriceRanking } from "./unit-price";

const pages = [
  resolveSeoPage({ name: "Home" }),
  ...seoStaticPages.map((page) => resolveSeoPage({ name: page.name })),
  ...catalogCategories.map((category) => resolveSeoPage({
    name: "CategoryDetail",
    slug: category.slug,
  })),
  ...nutriDataset.products.map((product) => resolveSeoPage({
    name: "ProductDetail",
    slug: product.slug,
  })),
];

describe("route SEO metadata", () => {
  it("has unique, bounded metadata and self canonicals", () => {
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.canonical)).size).toBe(pages.length);
    expect(pages.every((page) => page.title.length <= 60)).toBe(true);
    expect(pages.every((page) => page.description.length <= 155)).toBe(true);
    expect(pages.every((page) => page.robots === "index,follow")).toBe(true);
  });

  it("keeps comparison canonical free of query state", () => {
    expect(resolveSeoPage({ name: "Compare" }).canonical).toBe(
      "https://shakilabs.com/nutri/compare",
    );
  });

  it("uses noindex and no canonical for invalid routes", () => {
    const page = resolveSeoPage({ name: "ProductDetail", slug: "not-real" });
    expect(page.robots).toBe("noindex,nofollow");
    expect(page.canonical).toBeNull();
    expect(resolveSeoPage({ name: "CategoryDetail", slug: ["omega-3"] }).robots)
      .toBe("noindex,nofollow");
  });

  it("does not publish offer or review rating schema", () => {
    const structured = JSON.stringify(pages.map((page) => page.structuredData));
    expect(structured).not.toContain("AggregateRating");
    expect(structured).not.toContain('"@type":"Offer"');
    expect(structured).not.toContain('"@type":"Product"');
  });

  it("publishes a large social preview image", () => {
    const head = buildHeadTags(resolveSeoPage({ name: "Home" }));
    expect(head.meta).toContainEqual(expect.objectContaining({
      property: "og:image",
      content: "https://shakilabs.com/nutri/og-image.png",
    }));
    expect(head.meta).toContainEqual(expect.objectContaining({
      name: "twitter:card",
      content: "summary_large_image",
    }));
  });
});

// 2026-10 네이버 CTR 작업: 네이버는 제목을 약 35자에서 자른다.
const NAVER_VISIBLE_CHARS = 35;
const toolPages = [
  resolveSeoPage({ name: "Compare" }),
  ...catalogCategories.map((category) => resolveSeoPage({ name: "CategoryDetail", slug: category.slug })),
  ...nutriDataset.products.map((product) => resolveSeoPage({ name: "ProductDetail", slug: product.slug })),
];
const sitePages = seoStaticPages.filter((page) => page.titleKind === "site");

describe("title recipe", () => {
  it("keeps the app code and the built-HTML gate on the same rules", () => {
    expect(builtTitleRules.BRAND_TITLE_SUFFIX).toBe(BRAND_TITLE_SUFFIX);
    expect(builtTitleRules.SITE_TITLE_SUFFIX).toBe(` · ${APP_TITLE_NAME}${BRAND_TITLE_SUFFIX}`);
    expect(builtTitleRules.FORBIDDEN_META_WORDS.source).toBe(FORBIDDEN_META_WORDS.source);
    expect([...builtTitleRules.SITE_TITLE_ROUTES].sort())
      .toEqual(sitePages.map((page) => page.path).sort());
  });

  it("drops the middle app name on tool pages", () => {
    for (const page of [resolveSeoPage({ name: "Home" }), ...toolPages]) {
      // 옛 레시피 "{페이지} | 영양제 가격 비교 | ShakiLabs"는 세 조각이라 여기서 걸린다
      expect(page.title.split(" | "), page.title).toEqual([expect.any(String), "ShakiLabs"]);
      expect(page.title.endsWith(` · ${APP_TITLE_NAME}${BRAND_TITLE_SUFFIX}`), page.title).toBe(false);
    }
  });

  it("names the app on hub, policy and 404 pages so titles stay unique across ShakiLabs apps", () => {
    for (const page of sitePages) {
      expect(resolveSeoPage({ name: page.name }).title).toBe(siteTitle(page.pageTitle));
    }
    expect(resolveSeoPage({ name: "ProductDetail", slug: "not-real" }).title)
      .toBe(`페이지를 찾을 수 없습니다 · ${APP_TITLE_NAME}${BRAND_TITLE_SUFFIX}`);
  });

  it("never promises efficacy, recommendations or the lowest price in search metadata", () => {
    for (const page of pages) {
      expect(page.title, page.title).not.toMatch(FORBIDDEN_META_WORDS);
      expect(page.description, page.description).not.toMatch(FORBIDDEN_META_WORDS);
    }
    // 역방향: 금지어가 실제로 걸리는지 확인한다(빈 정규식이면 위 검사는 항상 통과한다)
    for (const word of ["효능", "효과", "개선", "도움", "추천", "최저가"]) {
      expect(`비타민D ${word}`).toMatch(FORBIDDEN_META_WORDS);
    }
  });

  it("builds category titles from the registry count, price-data year and comparison basis", () => {
    for (const category of catalogCategories) {
      const page = resolveSeoPage({ name: "CategoryDetail", slug: category.slug });
      const ranking = resolveUnitPriceRanking(category.slug);
      if (!ranking) throw new Error(`${category.slug}: unit-price ranking missing`);
      const basis = categoryTitleBasis(ranking.category.activeUnit);
      // 제목의 "무엇당"이 카탈로그 비교 기준과 같은 축인지 대조한다
      if (ranking.category.activeUnit === "cfu") expect(category.comparisonBasis).toContain("균수");
      else expect(category.comparisonBasis).toMatch(/^1일 .+ 함량과 1일 비용$/);
      const year = ranking.updatedAt.slice(0, 4);
      const count = category.registry.length.toLocaleString("ko-KR");
      const expected = isRankingEligible(ranking)
        ? `${category.name} 영양제 순위 ${year} · ${basis} 가격 비교 (식약처 등록 ${count}건)`
        : `${category.name} 영양제 ${basis} 가격 비교 ${year} (식약처 등록 ${count}건)`;
      expect(page.title).toBe(`${expected}${BRAND_TITLE_SUFFIX}`);
      // 검색 구절과 비교 기준은 네이버가 자르기 전에 끝나야 한다
      expect(page.title.indexOf("가격 비교") + "가격 비교".length).toBeLessThanOrEqual(NAVER_VISIBLE_CHARS);
      expect(page.description).toContain(`검증 제품 ${ranking.scores.length}개의 ${ranking.category.basisLabel} 가격`);
      expect(page.description).toContain(`식약처 등록 ${count}건`);
      expect(page.description.length).toBeLessThanOrEqual(110);
    }
  });

  it("leads product titles with the product name, price and the nutrient row count", () => {
    for (const product of nutriDataset.products) {
      const page = resolveSeoPage({ name: "ProductDetail", slug: product.slug });
      expect(page.title).toBe(
        `${product.officialName} 가격·1일 비용 · ${nutrientReferences.length}개 영양소 함량${BRAND_TITLE_SUFFIX}`,
      );
      expect(page.description.startsWith(product.officialName)).toBe(true);
      expect(page.description.length).toBeLessThanOrEqual(110);
    }
  });
});
