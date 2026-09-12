import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildOutboundUrl,
  isAffiliateLink,
  isCoupangUrl,
  outboundRel,
  resolvePartnerId,
  retailerOf,
} from "./affiliate";

// 리터럴 앵커. 입력 URL → 출력 URL을 그대로 적어 둔다 — 파라미터 이름 하나가 바뀌면
// 수수료가 조용히 0이 되는데, 파생식으로 비교하는 테스트는 그걸 못 잡는다.
const PARTNER_ID = "AF1234567";

describe("resolvePartnerId", () => {
  it("AF 접두어가 있든 없든 같은 정규형을 만든다", () => {
    expect(resolvePartnerId("AF1234567")).toBe("AF1234567");
    expect(resolvePartnerId("af1234567")).toBe("AF1234567");
    expect(resolvePartnerId(" 1234567 ")).toBe("AF1234567");
  });

  it("미설정·빈 값·형식 불일치는 전부 null (= 비제휴 동작)", () => {
    // 이 함대는 env 슬롯이 비어 별칭 문자열이 그대로 URL에 들어간 사고를 낸 적이 있다.
    expect(resolvePartnerId(undefined)).toBeNull();
    expect(resolvePartnerId("")).toBeNull();
    expect(resolvePartnerId("   ")).toBeNull();
    expect(resolvePartnerId("AF")).toBeNull();
    expect(resolvePartnerId("YOUR_PARTNER_ID")).toBeNull();
    expect(resolvePartnerId("AF12")).toBeNull();
    expect(resolvePartnerId(null)).toBeNull();
  });
});

describe("isCoupangUrl", () => {
  it("쿠팡 호스트만 참", () => {
    expect(isCoupangUrl("https://www.coupang.com/vp/products/123456789")).toBe(true);
    expect(isCoupangUrl("https://link.coupang.com/a/abcDEF")).toBe(true);
    expect(isCoupangUrl("https://prod.danawa.com/info/?pcode=5824834")).toBe(false);
  });

  it("호스트를 부분 문자열로 판정하지 않는다", () => {
    // url.includes("coupang.com") 였다면 아래 두 개가 모두 제휴 변환 대상이 된다.
    expect(isCoupangUrl("https://coupang.com.example.net/vp/products/1")).toBe(false);
    expect(isCoupangUrl("https://evil.test/?next=https://www.coupang.com/vp/products/1")).toBe(false);
    expect(isCoupangUrl("javascript:alert(1)")).toBe(false);
    expect(isCoupangUrl("not a url")).toBe(false);
  });
});

describe("buildOutboundUrl — 파트너스 ID 미설정", () => {
  const cases: [string, string][] = [
    [
      "https://www.coupang.com/vp/products/123456789?itemId=987",
      "https://www.coupang.com/vp/products/123456789?itemId=987",
    ],
    [
      "https://link.coupang.com/a/abcDEF",
      "https://link.coupang.com/a/abcDEF",
    ],
    [
      "https://prod.danawa.com/info/?pcode=5824834",
      "https://prod.danawa.com/info/?pcode=5824834",
    ],
  ];

  it.each(cases)("%s 는 글자 그대로 나간다", (input, expected) => {
    expect(buildOutboundUrl(input, { partnerId: null, subId: "centrum-men-50" })).toBe(expected);
    expect(buildOutboundUrl(input, { partnerId: "", subId: "centrum-men-50" })).toBe(expected);
    // 빈 값이 lptag= 로 들어가는 조용한 결함이 없어야 한다.
    expect(buildOutboundUrl(input, { partnerId: "" })).not.toContain("lptag");
  });
});

describe("buildOutboundUrl — 파트너스 ID 설정", () => {
  const cases: [string, string][] = [
    [
      "https://www.coupang.com/vp/products/123456789",
      "https://www.coupang.com/vp/products/123456789?lptag=AF1234567&subid=centrum-men-50",
    ],
    [
      "https://www.coupang.com/vp/products/123456789?itemId=987",
      "https://www.coupang.com/vp/products/123456789?itemId=987&lptag=AF1234567&subid=centrum-men-50",
    ],
    [
      // 쿠팡이 아닌 판매처는 ID가 있어도 건드리지 않는다.
      "https://prod.danawa.com/info/?pcode=5824834",
      "https://prod.danawa.com/info/?pcode=5824834",
    ],
  ];

  it.each(cases)("%s → 리터럴 대조", (input, expected) => {
    expect(buildOutboundUrl(input, { partnerId: PARTNER_ID, subId: "centrum-men-50" })).toBe(expected);
  });

  it("남의 AF 코드가 붙어 있으면 우리 것으로 덮는다", () => {
    expect(
      buildOutboundUrl("https://www.coupang.com/vp/products/1?lptag=AF9999999", { partnerId: PARTNER_ID }),
    ).toBe("https://www.coupang.com/vp/products/1?lptag=AF1234567");
  });

  it("subId가 형식에 맞지 않으면 붙이지 않는다 (빈 subid 금지)", () => {
    expect(buildOutboundUrl("https://www.coupang.com/vp/products/1", { partnerId: PARTNER_ID, subId: "" }))
      .toBe("https://www.coupang.com/vp/products/1?lptag=AF1234567");
    expect(buildOutboundUrl("https://www.coupang.com/vp/products/1", { partnerId: PARTNER_ID, subId: "a b/c" }))
      .toBe("https://www.coupang.com/vp/products/1?lptag=AF1234567");
  });
});

describe("isAffiliateLink / outboundRel", () => {
  it("제휴 링크에만 sponsored를 붙인다", () => {
    expect(outboundRel("https://www.coupang.com/vp/products/1", PARTNER_ID)).toBe("sponsored noopener");
    expect(outboundRel("https://prod.danawa.com/info/?pcode=1", PARTNER_ID)).toBe("noopener noreferrer");
    expect(outboundRel("https://www.coupang.com/vp/products/1", null)).toBe("noopener noreferrer");
  });

  it("ID가 없으면 쿠팡 링크도 제휴가 아니다", () => {
    expect(isAffiliateLink("https://www.coupang.com/vp/products/1", null)).toBe(false);
    expect(isAffiliateLink("https://www.coupang.com/vp/products/1", PARTNER_ID)).toBe(true);
    expect(isAffiliateLink("https://prod.danawa.com/info/?pcode=1", PARTNER_ID)).toBe(false);
  });
});

describe("retailerOf", () => {
  it("GA4 파라미터용 판매처 키", () => {
    expect(retailerOf("https://www.coupang.com/vp/products/1")).toBe("coupang");
    expect(retailerOf("https://prod.danawa.com/info/?pcode=1")).toBe("danawa");
    expect(retailerOf("https://catalog.11st.co.kr/vendor/pdetail?prdNo=1")).toBe("11st");
    expect(retailerOf("https://www.ssg.com/item/itemView.ssg?itemId=1")).toBe("ssg");
    expect(retailerOf("nope")).toBe("unknown");
  });
});

// 컴포넌트가 실제로 부르는 것은 env에 묶인 outboundUrl/outboundRel이다. 두 빌드 모드를
// 모두 평가해 "미설정인데 파라미터가 붙는" / "설정인데 안 붙는" 양쪽을 잠근다.
async function loadWithEnv(partnerId: string) {
  vi.resetModules();
  vi.stubEnv("VITE_COUPANG_PARTNER_ID", partnerId);
  return import("./affiliate");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("outboundUrl — env 바인딩", () => {
  it("미설정 빌드: 쿠팡 URL도 원문 그대로", async () => {
    const util = await loadWithEnv("");
    expect(util.AFFILIATE_ENABLED).toBe(false);
    expect(util.outboundUrl("https://www.coupang.com/vp/products/123456789", "centrum-men-50"))
      .toBe("https://www.coupang.com/vp/products/123456789");
    expect(util.outboundRel("https://www.coupang.com/vp/products/1")).toBe("noopener noreferrer");
  });

  it("설정 빌드: 쿠팡 URL에만 파라미터와 sponsored", async () => {
    const util = await loadWithEnv("AF1234567");
    expect(util.AFFILIATE_ENABLED).toBe(true);
    expect(util.outboundUrl("https://www.coupang.com/vp/products/123456789", "centrum-men-50"))
      .toBe("https://www.coupang.com/vp/products/123456789?lptag=AF1234567&subid=centrum-men-50");
    expect(util.outboundRel("https://www.coupang.com/vp/products/1")).toBe("sponsored noopener");
    expect(util.outboundUrl("https://prod.danawa.com/info/?pcode=5824834", "centrum-men-50"))
      .toBe("https://prod.danawa.com/info/?pcode=5824834");
    expect(util.outboundRel("https://prod.danawa.com/info/?pcode=1")).toBe("noopener noreferrer");
  });
});
