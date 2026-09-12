import { z } from "zod";
import { AFFILIATE_ENABLED, COUPANG_PARTNER_ID, resolvePartnerId } from "@/data/affiliate-config";

// 쿠팡 파트너스 제휴 링크 변환의 유일한 지점.
//
// Why one module: URL 조립이 컴포넌트마다 흩어지면 "어떤 화면에서 어떤 파라미터가 붙는지"를
// 사람이 셀 수 없게 되고, 그 순간 /disclosure의 공개 문구가 실제 렌더와 어긋나기 시작한다.
// 이 저장소는 이미 "지키지 않는 규칙을 공개한" 결함 이력이 있으므로, 변환은 여기서만 한다.
// 파트너스 ID 자체는 data/affiliate-config.ts가 들고 있다 — 공개 문구와 같은 값을 봐야 한다.
export { AFFILIATE_ENABLED, COUPANG_PARTNER_ID, resolvePartnerId };

// 호스트는 정확히 대조한다. `url.includes("coupang.com")`은 coupang.com.example.net 같은
// 남의 도메인까지 제휴 변환 대상으로 만든다.
const COUPANG_HOSTS = new Set([
  "coupang.com",
  "www.coupang.com",
  "m.coupang.com",
  "link.coupang.com",
  "shop.coupang.com",
]);

function parseUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

/** 쿠팡 판매 페이지 URL인가(제휴 변환 후보). */
export function isCoupangUrl(raw: string): boolean {
  const url = parseUrl(raw);
  return url !== null && COUPANG_HOSTS.has(url.hostname.toLowerCase());
}

const RETAILER_BY_HOST: Record<string, string> = {
  "coupang.com": "coupang",
  "www.coupang.com": "coupang",
  "m.coupang.com": "coupang",
  "link.coupang.com": "coupang",
  "shop.coupang.com": "coupang",
  "prod.danawa.com": "danawa",
  "www.danawa.com": "danawa",
  "catalog.11st.co.kr": "11st",
  "www.11st.co.kr": "11st",
  "www.ssg.com": "ssg",
};

/** GA4 파라미터용 판매처 키. 모르는 호스트는 호스트명 그대로(개인정보 없음). */
export function retailerOf(raw: string): string {
  const url = parseUrl(raw);
  if (!url) return "unknown";
  const host = url.hostname.toLowerCase();
  return RETAILER_BY_HOST[host] ?? host;
}

// subId는 "어느 자리에서 눌렀는가"를 구분하는 제품 슬롯 식별자다. 방문자 식별자가 아니며,
// 쿠키·해시·세션 값을 넣지 않는다 — /disclosure가 그렇게 공개돼 있다.
const subIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{1,50}$/);

interface OutboundOptions {
  partnerId?: string | null;
  subId?: string | null;
}

/**
 * 외부 링크를 실제로 렌더할 URL로 바꾼다.
 * 쿠팡이 아니거나 파트너스 ID가 없으면 **입력 URL을 글자 그대로** 돌려준다.
 */
export function buildOutboundUrl(raw: string, options: OutboundOptions = {}): string {
  const partnerId = resolvePartnerId(options.partnerId ?? undefined);
  if (partnerId === null) return raw;
  const url = parseUrl(raw);
  if (!url || !COUPANG_HOSTS.has(url.hostname.toLowerCase())) return raw;
  // lptag = 파트너스 링크의 제휴사 식별 파라미터. 이미 붙어 있으면 우리 것으로 덮는다
  // (남의 AF 코드가 섞인 URL을 그대로 내보내지 않기 위해).
  url.searchParams.set("lptag", partnerId);
  const subId = subIdSchema.safeParse(options.subId ?? undefined);
  if (subId.success) url.searchParams.set("subid", subId.data);
  return url.toString();
}

/** 이 빌드에서 실제로 렌더될 URL. 컴포넌트는 이 함수만 부른다. */
export function outboundUrl(raw: string, subId?: string): string {
  return buildOutboundUrl(raw, { partnerId: COUPANG_PARTNER_ID, subId });
}

/** 렌더된 링크가 제휴 링크인가(= 수수료가 발생할 수 있는가). */
export function isAffiliateLink(raw: string, partnerId: string | null = COUPANG_PARTNER_ID): boolean {
  return resolvePartnerId(partnerId ?? undefined) !== null && isCoupangUrl(raw);
}

/**
 * 제휴 링크는 rel="sponsored"를 붙인다(구글 링크 표기 가이드). 비제휴 링크는 기존
 * noopener noreferrer를 유지한다 — 제휴 링크에서 noreferrer를 빼는 것은 의도적이다
 * (쿠팡 쪽 유입 확인에 리퍼러가 쓰인다).
 */
export function outboundRel(raw: string, partnerId: string | null = COUPANG_PARTNER_ID): string {
  return isAffiliateLink(raw, partnerId) ? "sponsored noopener" : "noopener noreferrer";
}
