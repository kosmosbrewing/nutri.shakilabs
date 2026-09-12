// 제휴 공개 문구의 단일 출처.
//
// Why derived instead of hand-written: "모든 가격 링크는 비제휴입니다"는 파트너스 ID가
// 주입되는 순간 거짓이 된다. 문장을 여섯 군데 손으로 적어 두면 그중 하나는 반드시 남는다.
// 그래서 문장을 AFFILIATE_ENABLED에서 파생시키고, 게이트가 두 빌드 모드를 모두 렌더해 대조한다.
//
// Why Korean strings live in this .ts: price-freshness.ts와 같은 이유 — 브랜드 폰트 서브셋은
// .vue만 스캔하고 64 KiB 예산이 거의 찼다. 본문 폰트(Pretendard)는 src 전체를 스캔하므로
// 여기 문자열도 서브셋에 포함된다.
import { AFFILIATE_ENABLED } from "./affiliate-config";

/**
 * 쿠팡 파트너스 대가성 고지 문구.
 *
 * 공식 문서(partners.coupang.com 도움말)는 로그인 뒤에 있어 원문을 확인하지 못했다.
 * 그래서 가장 보수적인 형태를 택한다: 공정거래위원회 「추천·보증 등에 관한 표시·광고 심사지침」이
 * 요구하는 "경제적 이해관계"를 명확한 문장으로, 제휴 링크가 실제로 노출되는 화면마다,
 * 링크와 같은 화면의 잘 보이는 위치에 표시한다(푸터 한 곳으로 대체하지 않는다).
 */
export const COUPANG_DISCLOSURE_SENTENCE =
  "이 페이지에는 쿠팡 파트너스 활동의 일환으로 제휴 링크가 포함돼 있으며, 이에 따른 일정액의 수수료를 제공받습니다.";

/** 제휴 여부와 무관하게 항상 참인 문장. 순위 독립성은 어느 모드에서도 바뀌지 않는다. */
export const RANKING_INDEPENDENCE_SENTENCE =
  "제휴 여부와 수수료는 순위 산식의 입력값이 아닙니다.";

/**
 * 푸터·티커에 쓰는 사이트 전역 한 줄.
 * 비제휴 빌드에서만 "전부 비제휴"라고 단정한다.
 */
export const siteLinkNote = AFFILIATE_ENABLED
  ? `쿠팡 링크는 파트너스 제휴 링크입니다. ${RANKING_INDEPENDENCE_SENTENCE}`
  : `현재 공개된 모든 가격 링크는 비제휴입니다. ${RANKING_INDEPENDENCE_SENTENCE}`;

/** 티커는 한 줄 폭이 좁아 짧은 변형을 쓴다. 단정의 강도는 위와 같다. */
export const siteLinkNoteShort = AFFILIATE_ENABLED
  ? "쿠팡 링크는 파트너스 제휴 링크입니다"
  : "모든 가격 링크는 비제휴입니다";

/** 링크 한 개 옆에 붙는 라벨. 링크 단위라 언제나 정확하다. */
export function linkBadgeLabel(affiliate: boolean): string {
  return affiliate ? "제휴 링크" : "비제휴 링크";
}

/** 제품 상세의 버튼 문구. */
export function offerLinkLabel(affiliate: boolean): string {
  return affiliate ? "가격 원문 · 제휴 ↗" : "가격 원문 · 비제휴 ↗";
}

/** /disclosure "현재 상태" 본문. */
export const disclosureStatusParagraph = AFFILIATE_ENABLED
  ? "가격·판매처 링크 가운데 쿠팡으로 가는 링크는 쿠팡 파트너스 제휴 링크입니다. 그 링크를 통해 구매가 일어나면 영양만점이 쿠팡에서 일정액의 수수료를 받습니다. 쿠팡이 아닌 판매처(다나와·SSG·11번가·제조사) 링크와 공식 근거 링크는 제휴 링크가 아니며 수수료가 발생하지 않습니다. 제휴 링크에는 화면에서 제휴 링크 표시가 붙고, 해당 화면 안에 대가성 고지 문구를 함께 둡니다."
  : "현재 모든 가격·판매처 링크는 비제휴입니다. 링크 클릭이나 구매로 영양만점이 수수료를 받지 않습니다. 쿠팡 파트너스 제휴 링크는 파트너스 ID가 이 빌드에 주입될 때만 활성화되며, 그때는 이 문단과 화면의 링크 표시가 함께 바뀝니다.";

/** /disclosure "수익 구조" 본문 중 제휴에 관한 문장. */
export const revenueModelParagraph = AFFILIATE_ENABLED
  ? "이 사이트의 수익원은 광고와 쿠팡 파트너스 제휴 수수료 두 가지입니다. 쿠팡이 아닌 판매처 링크에서는 수수료를 받지 않고, 제조사·판매자에게 게재비나 원고료를 받지 않습니다. 유료 회원이나 데이터 판매도 하지 않습니다."
  : "현재 이 사이트의 수익원은 광고 하나뿐입니다. 판매 페이지로 나가는 링크에서는 수수료를 받지 않고, 제조사·판매자에게 게재비나 원고료를 받지 않습니다. 유료 회원이나 데이터 판매도 하지 않습니다.";

/** /disclosure "판매 링크를 다루는 방식" 중 추적 파라미터에 관한 문장. */
export const linkHandlingParagraph = AFFILIATE_ENABLED
  ? "판매처 링크는 가격을 확인한 바로 그 화면으로 보냅니다. 쿠팡 제휴 링크에는 파트너스 식별자(lptag)와 어느 자리에서 눌렀는지를 구분하는 제품 식별자(subid)만 붙입니다. 방문자를 구분하는 값은 붙이지 않으므로, 링크를 눌러도 이 사이트가 누가 무엇을 샀는지 알 수 없습니다."
  : "판매처 링크는 가격을 확인한 바로 그 화면으로 보냅니다. 중간에 추적 주소를 끼우거나 방문자를 구분하는 값을 붙이지 않으므로, 링크를 눌러도 이 사이트가 누가 무엇을 샀는지 알 수 없습니다.";

/** /disclosure "순위에 들어가지 않는 것" 중 판매처 중립성에 관한 문장. */
export const sellerNeutralityParagraph = AFFILIATE_ENABLED
  ? "판매 링크는 값을 확인한 원문으로 연결하기 위한 것입니다. 쿠팡 링크에서는 수수료가 생기지만, 순위를 만드는 입력값은 공개 가격·필수 배송비·총 복용일수·공식 함량 네 가지뿐이라 수수료가 순서를 바꾸지 못합니다. 수수료가 더 큰 제품을 위로 올리거나, 제휴가 없는 판매처의 제품을 뒤로 미루지 않습니다."
  : "판매 링크는 값을 확인한 원문으로 연결하기 위한 것입니다. 그 링크에서 무엇을 사든 이 사이트의 수익은 달라지지 않으므로, 특정 판매처로 몰아 보낼 이유가 없습니다.";

/** /disclosure 메타 설명. 제휴 상태를 단정하는 문장이라 여기서 파생시킨다. */
export const disclosureMetaDescription = AFFILIATE_ENABLED
  ? "쿠팡 파트너스 제휴 링크의 대가성 고지와 표시 규칙, 자연 순위 독립성, 광고의 분리 배치 원칙을 공개합니다."
  : "현재 비제휴 상태와 자연 순위 독립성, 제휴 링크·광고의 명확한 표시와 배치 원칙을 공개합니다.";

/** /disclosure 뷰가 쓰는 짧은 문구들. .vue에 한글을 더 넣으면 브랜드 폰트 예산이 넘친다. */
export const disclosureAdLoaderTail =
  "Google AdSense 광고 로더는 포함하며, 광고가 게재되면 아래 광고 원칙을 따릅니다.";
export const paidEndorsementHeading = "쿠팡 파트너스 대가성 고지";
export const disclosureLinkRuleHeading = "제휴 링크 표시 규칙";
export const disclosureNonAffiliateLabelRule = "제휴 링크가 아닌 링크에는 비제휴라고 표시합니다.";
export const disclosureDormantParagraph =
  `이 빌드에는 쿠팡 파트너스 ID가 주입돼 있지 않아 제휴 링크가 없습니다. 제휴 링크가 활성화되면 링크가 노출되는 화면마다 다음 문장을 함께 표시합니다: ${COUPANG_DISCLOSURE_SENTENCE}`;

/** /compare 근거 목록 한 줄. 실제 URL에서 파생한 불리언을 받는다. */
export function comparisonSourcesNote(anyAffiliate: boolean): string {
  return anyAffiliate
    ? "일부 링크는 쿠팡 파트너스 제휴 링크이며, 이에 따른 일정액의 수수료를 제공받습니다."
    : "이 목록의 링크는 모두 비제휴 원문입니다.";
}
