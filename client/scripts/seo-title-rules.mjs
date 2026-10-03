// 빌드 산출물 제목 게이트(verify-static)의 규칙. 앱 코드는 src/utils/seo-title.ts가 같은 값을 들고 있고,
// seo.test가 두 쪽을 대조한다 — 앱 번들이 scripts를 import하지 않아 값이 두 곳에 있기 때문이다.
// 왜 산출물에서 또 보나: 단위 테스트는 함수 반환값만 본다. 셸(index.html)의 기본 <title>이 남거나
// SVG <title>이 끼면(0.3.42 이전 차트) 크롤러가 받는 HTML만 레시피에서 벗어난다.
export const BRAND_TITLE_SUFFIX = " | ShakiLabs";
export const SITE_TITLE_SUFFIX = " · 영양제 가격 비교 | ShakiLabs";
// 허브·방법·출처·소개·정책은 앱 이름을 단다(12개 앱의 "이용약관 | ShakiLabs" 중복 방지). 404도 같다.
export const SITE_TITLE_ROUTES = new Set([
  "/categories",
  "/methodology",
  "/sources",
  "/about",
  "/privacy",
  "/terms",
  "/disclosure",
]);
// YMYL: 페이지가 하지 않는 약속을 검색 결과 메타(title·description·og)에 쓰지 않는다.
export const FORBIDDEN_META_WORDS = /효능|효과|개선|도움|추천|최저가|치료|예방/;
