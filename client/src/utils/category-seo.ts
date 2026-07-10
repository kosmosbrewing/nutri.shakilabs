import { findCategory } from "./category-catalog";

const SITE_BASE = "https://shakilabs.com/nutri";
const UPDATED_AT = "2026-07-10";

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
  const path = `/categories/${category.slug}`;
  const description = `${category.name} 영양제 공식 레코드 ${category.recordCount}건의 등록 현황과 제품 예시, 향후 가격효율 비교에 필요한 추가 근거를 확인합니다.`;
  return {
    title: `${category.name} 영양제 공식 등록 제품 | 영양만점`,
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      {
        "@type": "CollectionPage",
        name: `${category.name} 영양제 공식 등록 제품`,
        url: canonical(path),
        description,
        dateModified: UPDATED_AT,
      },
      {
        "@type": "ItemList",
        name: `${category.name} 공식 등록 예시`,
        itemListElement: category.records.map((record, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: record.name,
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
