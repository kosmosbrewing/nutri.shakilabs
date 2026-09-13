// 제휴 정직성 게이트의 규칙. 빌드 산출물 검사(verify-static)와 단위 테스트가 같은 목록을
// 읽도록 한 곳에 둔다 — 두 곳에 베껴 두면 한쪽만 낡는다.

/**
 * 제휴 빌드에서 화면에 남으면 안 되는 **사이트 전역 단정** 문구.
 *
 * 링크 한 개 옆의 "비제휴 링크" 라벨은 여기 넣지 않는다. 그건 그 링크에 한정된 참인
 * 서술이고, /disclosure가 "제휴 링크가 아닌 링크에는 비제휴라고 표시한다"고 약속한 바로
 * 그 표시다. 금지 대상은 "모든/전부"처럼 사이트 전체를 덮는 단정뿐이다.
 */
export const FORBIDDEN_BLANKET_CLAIMS = [
  "모든 가격 링크는 비제휴",
  "모든 가격·판매처 링크는 비제휴",
  "모든 링크는 비제휴",
  "전부 비제휴",
  "링크 클릭이나 구매로 영양만점이 수수료를 받지 않습니다",
  "수익은 달라지지 않으므로",
  "수익원은 광고 하나뿐",
];

/** 파트너스 파라미터. 미설정 빌드의 어떤 URL에도 나타나면 안 된다. */
export const AFFILIATE_URL_PARAMS = ["lptag=", "subid="];

/** 제휴 링크가 노출된 페이지에 있어야 하는 대가성 고지 마커. */
export const DISCLOSURE_MARKER = "data-affiliate-disclosure";

const COUPANG_HOSTS = new Set([
  "coupang.com",
  "www.coupang.com",
  "m.coupang.com",
  "link.coupang.com",
  "shop.coupang.com",
]);

export function isCoupangHref(href) {
  try {
    return COUPANG_HOSTS.has(new URL(href).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** 렌더된 HTML에서 <a> 태그의 href/rel 쌍을 뽑는다. */
export function extractAnchors(html) {
  return (html.match(/<a\b[^>]*>/g) ?? []).map((tag) => ({
    tag,
    href: tag.match(/\shref="([^"]*)"/)?.[1] ?? "",
    rel: tag.match(/\srel="([^"]*)"/)?.[1] ?? "",
  }));
}
