import { findCategory } from "./category-catalog";
import { resolveUnitPriceRanking } from "./unit-price";

const SITE_BASE = "https://shakilabs.com/nutri";
const UPDATED_AT = "2026-07-11";

export interface CategorySeoPage {
  title: string;
  description: string;
  canonical: string;
  robots: "index,follow";
  structuredData: Record<string, unknown>[];
}

function canonical(path: string): string {
  return `${SITE_BASE}${path}`;
}

export function resolveCategorySeoPage(slugInput: unknown): CategorySeoPage | null {
  const category = findCategory(slugInput);
  if (!category) return null;
  const ranking = resolveUnitPriceRanking(category.slug);
  const path = `/categories/${category.slug}`;
  const description = ranking
    ? `${category.name} 영양제 검증 제품 ${ranking.scores.length}개의 ${ranking.category.basisLabel} 가격, 1일 비용, 공식 신고번호와 최신 가격 출처를 비교합니다.`
    : `${category.name} 영양제 공식 레코드 ${category.recordCount}건의 등록 현황과 제품 예시, 향후 가격효율 비교에 필요한 추가 근거를 확인합니다.`;
  const listItems = ranking
    ? ranking.scores.map(({ product, rank }) => ({ name: product.displayName, position: rank }))
    : category.records.map((record, index) => ({ name: record.name, position: index + 1 }));
  return {
    title: ranking
      ? `${category.name} 영양제 단위가격 비교 | 영양만점`
      : `${category.name} 영양제 공식 등록 제품 | 영양만점`,
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      {
        "@type": "CollectionPage",
        name: ranking ? `${category.name} 영양제 단위가격 비교` : `${category.name} 영양제 공식 등록 제품`,
        url: canonical(path),
        description,
        dateModified: UPDATED_AT,
      },
      {
        "@type": "ItemList",
        name: ranking ? `${category.name} 단위가격 순위` : `${category.name} 공식 등록 예시`,
        itemListElement: listItems.map((item) => ({
          "@type": "ListItem",
          position: item.position,
          name: item.name,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "영양만점", path: "/" },
          { name: "영양제 종류", path: "/categories" },
          { name: category.name, path },
        ].map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.path === "/" ? SITE_BASE : canonical(item.path),
        })),
      },
    ],
  };
}
