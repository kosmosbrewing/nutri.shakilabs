import { findCategory } from "./category-catalog";
import { brandTitle } from "./seo-title";
import { isRankingEligible, resolveUnitPriceRanking, unitPriceDataset } from "./unit-price";

const SITE_BASE = "https://shakilabs.com/nutri";
const UPDATED_AT = unitPriceDataset.updatedAt;

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

// 제목의 "무엇당 가격"은 카탈로그 comparisonBasis와 같은 축이어야 한다(테스트가 대조).
// 함량 기준 8종은 "1일 ○○ 함량과 1일 비용" → "1일 함량당", 프로바이오틱스는 "보장 균수" → "보장균수당".
// 원료명(EPA+DHA·실리마린)은 설명의 basisLabel이 정확히 적는다 — 제목에 넣으면 60자 게이트를 넘는다.
export function categoryTitleBasis(activeUnit: "mg" | "ug" | "cfu"): string {
  return activeUnit === "cfu" ? "보장균수당" : "1일 함량당";
}

export function resolveCategorySeoPage(slugInput: unknown): CategorySeoPage | null {
  const category = findCategory(slugInput);
  if (!category) return null;
  const ranking = resolveUnitPriceRanking(category.slug);
  const path = `/categories/${category.slug}`;
  // N은 손으로 적지 않는다: 화면 "식약처 등록 전체 N건" 표와 같은 등록부(신고번호 중복 제거)에서 센다.
  const registryCount = category.registry.length.toLocaleString("ko-KR");
  const registryColumns = category.activeUnit ? "제조사·섭취량·1일 함량" : "제조사·섭취량";
  const ranked = ranking !== null && isRankingEligible(ranking);
  // "가격효율"은 내부 용어라 제목에서 뺐다. "순위"는 4개 이상 비교될 때만 쓴다(본문 H1과 같은 조건).
  // 연도는 순위가 쓰는 가격 데이터의 기준 연도다 — 달력 연도가 아니다.
  const pageName = ranking
    ? ranked
      ? `${category.name} 영양제 순위 ${ranking.updatedAt.slice(0, 4)} · ${categoryTitleBasis(ranking.category.activeUnit)} 가격 비교 (식약처 등록 ${registryCount}건)`
      : `${category.name} 영양제 ${categoryTitleBasis(ranking.category.activeUnit)} 가격 비교 ${ranking.updatedAt.slice(0, 4)} (식약처 등록 ${registryCount}건)`
    : `${category.name} 영양제 식약처 등록 ${registryCount}건 목록`;
  // 설명은 화면이 실제로 싣는 것과 범위만 적는다(검증 제품 수·비교 기준·등록부 표). 효능·추천 서술 금지.
  const description = ranking
    ? `${category.name} 영양제 검증 제품 ${ranking.scores.length}개의 ${ranking.category.basisLabel} 가격 ${ranked ? "순위" : "비교"}와 배송비 포함 1일 비용, 식약처 등록 ${registryCount}건의 ${registryColumns} 표를 보여 줍니다.`
    : `${category.name} 영양제 식약처 등록 ${registryCount}건의 제품명·${registryColumns} 목록과 가격 비교에 아직 필요한 근거를 보여 줍니다.`;
  const listItems = ranking
    ? ranking.scores.map(({ product, rank }) => ({ name: product.displayName, position: rank }))
    : category.records.map((record, index) => ({ name: record.name, position: index + 1 }));
  return {
    title: brandTitle(pageName),
    description,
    canonical: canonical(path),
    robots: "index,follow",
    structuredData: [
      {
        "@type": "CollectionPage",
        name: pageName,
        url: canonical(path),
        description,
        dateModified: UPDATED_AT,
      },
      {
        "@type": "ItemList",
        name: ranking ? `${category.name} 가격효율 순위` : `${category.name} 공식 등록 예시`,
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
