// 제휴 정직성 게이트 — 렌더된 산출물에서만 판정한다.
//
// Why on dist and not on source: 이 저장소가 낸 결함은 "소스에는 규칙이 있는데 화면에는
// 다른 게 나간" 계열이다. 선언이 아니라 실제 HTML을 세야 잡힌다.
//
// 세 가지를 본다.
//  ① 파트너스 ID 설정 빌드에 사이트 전역 "비제휴" 단정이 남아 있으면 red
//  ② 미설정 빌드의 어떤 URL에도 파트너스 파라미터가 붙어 있으면 red
//  ③ 제휴 링크가 노출된 페이지에 대가성 고지 문구가 없으면 red (+ 역방향: 제휴 링크가
//     없는데 고지 문구만 떠 있어도 red — 그 문장도 거짓말이다)
import {
  AFFILIATE_URL_PARAMS,
  DISCLOSURE_MARKER,
  FORBIDDEN_BLANKET_CLAIMS,
  extractAnchors,
  isCoupangHref,
} from "./affiliate-honesty-rules.mjs";

function normalizePartnerId(raw) {
  const trimmed = String(raw ?? "").trim().replace(/^af/i, "");
  return /^[0-9]{4,12}$/.test(trimmed) ? `AF${trimmed}` : null;
}

export function verifyAffiliateHonesty({ pages, read, assert, partnerIdInput }) {
  const partnerId = normalizePartnerId(partnerIdInput);
  let affiliateAnchors = 0;
  let disclosurePages = 0;

  for (const page of pages) {
    const html = read(page.path);
    const anchors = extractAnchors(html);
    const pageAffiliate = anchors.filter((anchor) => isCoupangHref(anchor.href));
    const hasDisclosure = html.includes(DISCLOSURE_MARKER);

    if (partnerId === null) {
      // ② 미설정 빌드: 어떤 링크에도 파트너스 파라미터가 없어야 한다. 빈 값이 들어간
      // "lptag=" 같은 조용한 결함까지 여기서 걸린다.
      for (const anchor of anchors) {
        for (const parameter of AFFILIATE_URL_PARAMS) {
          assert(!anchor.href.includes(parameter),
            `${page.route}: 파트너스 ID가 없는 빌드인데 링크에 ${parameter}가 붙었다 — ${anchor.href}`);
        }
      }
      assert(!pageAffiliate.some((anchor) => anchor.rel.includes("sponsored")),
        `${page.route}: 비제휴 빌드에 sponsored rel이 있다`);
    } else {
      // ① 설정 빌드: 사이트 전역 비제휴 단정 금지.
      for (const claim of FORBIDDEN_BLANKET_CLAIMS) {
        assert(!html.includes(claim),
          `${page.route}: 제휴 빌드인데 전역 단정 "${claim}"이 남아 있다`);
      }
      // 쿠팡 링크는 예외 없이 제휴 링크로 렌더돼야 한다 — 한 개라도 변환에서 빠지면
      // 그 클릭은 수수료 없이 나가고 화면 표시와도 어긋난다.
      for (const anchor of pageAffiliate) {
        assert(anchor.href.includes(`lptag=${partnerId}`),
          `${page.route}: 쿠팡 링크에 lptag가 없다 — ${anchor.href}`);
        assert(anchor.rel.split(/\s+/).includes("sponsored"),
          `${page.route}: 제휴 링크에 rel="sponsored"가 없다 — ${anchor.href}`);
      }
    }

    const affiliateOnPage = partnerId !== null && pageAffiliate.length > 0;
    // ③ 양방향. 제휴 링크가 있으면 고지가 있어야 하고, 고지가 있으면 제휴 링크가 있어야 한다.
    assert(!affiliateOnPage || hasDisclosure,
      `${page.route}: 제휴 링크 ${pageAffiliate.length}개가 노출됐는데 대가성 고지 문구가 없다`);
    assert(!hasDisclosure || affiliateOnPage || page.route === "/disclosure",
      `${page.route}: 제휴 링크가 없는데 대가성 고지 문구가 떠 있다`);

    affiliateAnchors += affiliateOnPage ? pageAffiliate.length : 0;
    disclosurePages += hasDisclosure ? 1 : 0;
  }

  // /disclosure는 모드와 무관하게 현재 상태를 단정해야 한다.
  const disclosurePage = pages.find((page) => page.route === "/disclosure");
  assert(disclosurePage, "/disclosure 페이지가 산출물에 없다");
  const disclosureHtml = read(disclosurePage.path);
  if (partnerId === null) {
    assert(disclosureHtml.includes("현재 모든 가격·판매처 링크는 비제휴입니다"),
      "/disclosure: 비제휴 빌드는 비제휴 상태를 명시해야 한다");
  } else {
    assert(disclosureHtml.includes("쿠팡 파트너스 제휴 링크입니다"),
      "/disclosure: 제휴 빌드는 제휴 상태를 명시해야 한다");
    assert(disclosureHtml.includes("수수료를 제공받습니다"),
      "/disclosure: 제휴 빌드는 대가성 고지 문구를 실어야 한다");
  }

  return {
    mode: partnerId === null ? "non-affiliate" : "affiliate",
    partnerId,
    affiliateAnchors,
    disclosurePages,
  };
}
