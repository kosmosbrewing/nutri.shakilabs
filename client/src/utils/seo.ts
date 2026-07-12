import { z } from "zod";
import { seoProducts } from "@/data/seo-products";
import { seoStaticPages } from "@/data/seo-static-pages";
import { categoryCards } from "./category-catalog";
import { resolveCategorySeoPage } from "./category-seo";
import { parseProductSlug } from "./product-detail";

const SITE_BASE = "https://shakilabs.com/nutri";
const OG_IMAGE = `${SITE_BASE}/og-image.png`;
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
  const description = "식약처 제공 데이터로 10개 영양제 종류를 탐색하고, 9개 종류의 가격효율·단위가격과 멀티비타민 10개의 배송비 포함 영양효율을 비교합니다.";
  return {
    title: "영양제 종류·멀티비타민 가격 비교 | 영양만점",
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
  if (name === "CategoryDetail") return resolveCategorySeoPage(slug) ?? notFoundPage();
  const staticPage = seoStaticPages.find((page) => page.name === name);
  if (staticPage) return contentPage(
    staticPage.title,
    staticPage.description,
    staticPage.path,
    staticPage.type,
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
