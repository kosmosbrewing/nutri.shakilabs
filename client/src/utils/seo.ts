import { z } from "zod";
import { seoProducts } from "@/data/seo-products";
import { parseProductSlug } from "./product-detail";

const SITE_BASE = "https://shakilabs.com/nutri";
const UPDATED_AT = "2026-07-10";
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
  const description = "일반 성인용 멀티비타민 10개의 배송비 포함 1일 비용과 23개 영양소 충족도를 식약처 신고정보·라벨 근거로 비교합니다.";
  return {
    title: "멀티비타민 가격·영양 비교 2026 | 영양만점",
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
  const description = `${product.name}의 배송비 포함 1일 비용 ${product.dailyCostLabel}, 23개 영양소 충족도 ${product.coverageLabel}와 신고번호·라벨·가격 출처를 확인하세요.`;
  return {
    title: `${product.name} 성분·1일 가격 | 영양만점`,
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
  if (name === "Compare") return contentPage(
    "멀티비타민 성분·가격 나란히 비교 | 영양만점",
    "최대 4개 멀티비타민의 배송비 포함 1일 비용과 23개 영양소별 함량·기준 충족률을 같은 표에서 비교합니다.",
    "/compare",
    "WebPage",
  );
  if (name === "Methodology") return contentPage(
    "가격당 영양효율 점수 계산법 | 영양만점",
    "영양소별 100% 상한, 배송비 포함 1일 비용, 미표시·미확인 구분과 가격 신선도 등 value-v1 산식을 공개합니다.",
    "/methodology",
    "Article",
  );
  if (name === "Sources") return contentPage(
    "멀티비타민 비교 데이터 출처 | 영양만점",
    "식약처·공공데이터포털 제품 식별정보와 제조사·판매 페이지의 라벨·가격 근거, 확인일과 검증 해시를 공개합니다.",
    "/sources",
    "Article",
  );
  return notFoundPage();
}

function contentPage(
  title: string,
  description: string,
  path: string,
  type: "Article" | "WebPage",
): SeoPage {
  const main = type === "Article"
    ? article(title.split(" | ")[0]!, path)
    : { "@type": "WebPage", name: title.split(" | ")[0], url: canonical(path), description };
  return {
    title,
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      main,
      breadcrumb([
        { name: "영양만점", path: "/" },
        { name: title.split(" | ")[0]!, path },
      ]),
    ],
  };
}

function notFoundPage(): SeoPage {
  return {
    title: "페이지를 찾을 수 없습니다 | 영양만점",
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
      { key: "og:locale", property: "og:locale", content: "ko_KR" },
      { key: "twitter:card", name: "twitter:card", content: "summary" },
    ],
    link: page.canonical
      ? [{ key: "canonical", rel: "canonical", href: page.canonical }]
      : [],
    script: page.structuredData.length
      ? [{ key: "structured-data", type: "application/ld+json", innerHTML: graph }]
      : [],
  };
}
