// 정본 title 레시피 (2026-10 네이버 CTR 작업).
// 유입의 대부분인 네이버 검색 결과는 제목을 약 35자에서 자른다. 예전 레시피
// "{페이지} | 영양제 가격 비교 | ShakiLabs"는 가운데 접미사가 성분명·제품명 뒤의 비교 기준을 밀어냈다.
// - 도구 페이지(종류 상세·제품 상세·비교): "{페이지} | ShakiLabs" — 가운데 앱 이름을 뺀다.
// - 사이트 페이지(허브·방법·출처·소개·정책·404): "{페이지} · 영양제 가격 비교 | ShakiLabs".
//   앱 이름을 빼면 "이용약관 | ShakiLabs"가 12개 앱에서 같아져 한 도메인 안 중복 제목이 된다.
//   검색 유입이 목적인 페이지가 아니라 35자 절단도 문제가 되지 않는다.
// "영양만점"은 상품명이라 앱 이름 자리에 단독으로 쓰지 않는다(기존 금지 패턴 유지).
// SSG 정적 HTML도 이 함수들만 거쳐 제목을 만든다 — 레시피가 두 갈래로 갈라지지 않게.
export const BRAND_TITLE_SUFFIX = " | ShakiLabs";
export const APP_TITLE_NAME = "영양제 가격 비교";

export function brandTitle(pageTitle: string): string {
  return `${pageTitle}${BRAND_TITLE_SUFFIX}`;
}

export function siteTitle(pageTitle: string): string {
  return brandTitle(`${pageTitle} · ${APP_TITLE_NAME}`);
}

// YMYL: 페이지가 하지 않는 약속(효능·추천·최저가)을 제목·설명에 쓰지 않는다.
// 본문은 "효능 순위 아님"처럼 부정형으로 쓸 수 있어 검사 대상은 검색 결과에 노출되는 메타로 한정한다.
export const FORBIDDEN_META_WORDS = /효능|효과|개선|도움|추천|최저가|치료|예방/;
