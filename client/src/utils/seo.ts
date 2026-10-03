import { z } from "zod";
import { nutrientReferences } from "@/data/nutrients";
import { PRICE_CAPTURED_AT } from "@/data/price-freshness";
import { seoProducts } from "@/data/seo-products";
import { seoStaticPages } from "@/data/seo-static-pages";
import { categoryCards } from "./category-catalog";
import { resolveCategorySeoPage } from "./category-seo";
import { parseProductSlug } from "./product-detail";
import { brandTitle, siteTitle } from "./seo-title";

const SITE_BASE = "https://shakilabs.com/nutri";
const OG_IMAGE = `${SITE_BASE}/og-image.png`;
const UPDATED_AT = PRICE_CAPTURED_AT;
// 제품 상세가 보여 주는 영양소 행 수. 손으로 적지 않고 기준치 표에서 센다(verify-static이 23행을 따로 검사).
const NUTRIENT_COUNT = nutrientReferences.length;
const routeInputSchema = z.object({
  name: z.string(),
  slug: z.unknown().optional(),
}).strict();

type StructuredData = Record<string, unknown>;
export interface SeoPage {
  title: string;
  description: string;
  canonical: string | null;
  robots: "index,follow" | "noindex,nofollow";
  structuredData: StructuredData[];
}

function canonical(path: string): string {
  return path === "/" ? SITE_BASE : `${SITE_BASE}${path}`;
}

function breadcrumb(items: Array<{ name: string; path: string }>): StructuredData {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

function article(headline: string, path: string): StructuredData {
  return {
    "@type": "Article",
    headline,
    datePublished: UPDATED_AT,
    dateModified: UPDATED_AT,
    mainEntityOfPage: canonical(path),
    author: { "@type": "Organization", name: "ShakiLabs" },
    publisher: { "@type": "Organization", name: "ShakiLabs" },
  };
}

const validSlugs = seoProducts.map((product) => product.slug);

function homePage(): SeoPage {
  // 홈은 "{앱 이름} | ShakiLabs" 자리다. 앱 이름 "영양제 가격 비교"에 홈이 실제로 싣는 두 범위(종류 탐색·
  // 멀티비타민 순위)를 붙인 형태를 유지한다 — "멀티비타민 비교" 의도의 도착 페이지가 홈이다(SEO_TRUST_SPEC).
  const description = "식약처 제공 데이터로 10개 영양제 종류를 탐색하고, 9개 종류의 가격효율·단위가격과 멀티비타민 10개의 배송비 포함 영양효율을 비교합니다.";
  return {
    title: brandTitle("영양제 종류·멀티비타민 가격 비교"),
    description,
    canonical: canonical("/"),
    robots: "index,follow",
    structuredData: [
      {
        "@type": "WebApplication",
        name: "영양만점",
        url: canonical("/"),
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        description,
      },
      {
        "@type": "ItemList",
        itemListElement: seoProducts.map((product) => ({
          "@type": "ListItem",
          position: product.rank,
          name: product.name,
          url: canonical(`/products/${product.slug}`),
        })),
      },
      {
        "@type": "ItemList",
        name: "영양제 종류",
        itemListElement: categoryCards.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.name,
          url: category.href.startsWith("/nutri/categories/")
            ? `https://shakilabs.com${category.href}`
            : canonical("/"),
        })),
      },
      breadcrumb([{ name: "영양만점", path: "/" }]),
    ],
  };
}

function productPage(slugInput: unknown): SeoPage | null {
  const slugResult = parseProductSlug(slugInput, validSlugs);
  if (!slugResult.success) return null;
  const product = seoProducts.find((candidate) => candidate.slug === slugResult.slug);
  if (!product) return null;
  const path = `/products/${product.slug}`;
  // 검색 구절(제품명 + 가격)을 맨 앞에 둔다. "최저가"는 쓰지 않는다 — 판매처 한 곳의 확인 시점 가격일 뿐이다.
  const description = `${product.name}의 판매가·배송비로 계산한 1일 비용 ${product.dailyCostLabel}, ${NUTRIENT_COUNT}개 영양소 1일 함량과 영양충족도 ${product.coverageLabel}, 신고번호·라벨·가격 출처를 보여 줍니다.`;
  return {
    title: brandTitle(`${product.name} 가격·1일 비용 · ${NUTRIENT_COUNT}개 영양소 함량`),
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      {
        "@type": "WebPage",
        name: `${product.name} 성분·가격 근거`,
        url: canonical(path),
        description,
        dateModified: UPDATED_AT,
        about: { "@type": "Thing", name: product.name },
      },
      breadcrumb([
        { name: "영양만점", path: "/" },
        { name: product.name, path },
      ]),
    ],
  };
}

export function resolveSeoPage(input: unknown): SeoPage {
  const parsed = routeInputSchema.safeParse(input);
  if (!parsed.success) return notFoundPage();
  const { name, slug } = parsed.data;
  if (name === "Home") return homePage();
  if (name === "ProductDetail") return productPage(slug) ?? notFoundPage();
  if (name === "CategoryDetail") return resolveCategorySeoPage(slug) ?? notFoundPage();
  const staticPage = seoStaticPages.find((page) => page.name === name);
  if (staticPage) return contentPage(
    staticPage.pageTitle,
    staticPage.titleKind,
    staticPage.description,
    staticPage.path,
    staticPage.type,
  );
  return notFoundPage();
}

function contentPage(
  pageTitle: string,
  titleKind: "tool" | "site",
  description: string,
  path: string,
  type: "Article" | "WebPage",
): SeoPage {
  const main = type === "Article"
    ? article(pageTitle, path)
    : { "@type": "WebPage", name: pageTitle, url: canonical(path), description };
  return {
    title: titleKind === "tool" ? brandTitle(pageTitle) : siteTitle(pageTitle),
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      main,
      breadcrumb([
        { name: "영양만점", path: "/" },
        { name: pageTitle, path },
      ]),
    ],
  };
}

function notFoundPage(): SeoPage {
  return {
    title: siteTitle("페이지를 찾을 수 없습니다"),
    description: "요청한 영양만점 페이지를 찾을 수 없습니다.",
    canonical: null,
    robots: "noindex,nofollow",
    structuredData: [],
  };
}

export function buildHeadTags(page: SeoPage) {
  const graph = JSON.stringify({ "@context": "https://schema.org", "@graph": page.structuredData })
    .replaceAll("<", "\\u003c");
  return {
    title: page.title,
    htmlAttrs: { lang: "ko" },
    meta: [
      { key: "description", name: "description", content: page.description },
      { key: "robots", name: "robots", content: page.robots },
      { key: "og:title", property: "og:title", content: page.title },
      { key: "og:description", property: "og:description", content: page.description },
      { key: "og:type", property: "og:type", content: "website" },
      ...(page.canonical ? [{ key: "og:url", property: "og:url", content: page.canonical }] : []),
      { key: "og:image", property: "og:image", content: OG_IMAGE },
      { key: "og:image:width", property: "og:image:width", content: "1200" },
      { key: "og:image:height", property: "og:image:height", content: "630" },
      { key: "og:image:alt", property: "og:image:alt", content: "영양만점 멀티비타민 가격·영양 비교" },
      { key: "og:locale", property: "og:locale", content: "ko_KR" },
      { key: "twitter:card", name: "twitter:card", content: "summary_large_image" },
      { key: "twitter:image", name: "twitter:image", content: OG_IMAGE },
    ],
    link: page.canonical
      ? [{ key: "canonical", rel: "canonical", href: page.canonical }]
      : [],
    script: page.structuredData.length
      ? [{ key: "structured-data", type: "application/ld+json", innerHTML: graph }]
      : [],
  };
}
