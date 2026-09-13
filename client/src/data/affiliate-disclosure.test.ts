import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — 빌드 스크립트 ESM 모듈(타입 선언 없음). 게이트 규칙을 산출물 검사와 공유한다.
import { FORBIDDEN_BLANKET_CLAIMS } from "../../scripts/affiliate-honesty-rules.mjs";

// 두 빌드 모드를 한 실행에서 모두 본다. import.meta.env는 모듈 평가 시점에 읽히므로
// stubEnv + resetModules로 다시 평가시켜야 한다 — 한 모드만 테스트하면 "설정 빌드에서
// 비제휴 단정이 남는" 바로 그 결함을 못 잡는다.
async function loadCopy(partnerId: string) {
  vi.resetModules();
  vi.stubEnv("VITE_COUPANG_PARTNER_ID", partnerId);
  const copy = await import("./affiliate-disclosure");
  const config = await import("./affiliate-config");
  return { copy, config };
}

/** 한 모드에서 화면에 나갈 수 있는 모든 전역 문장. */
function allSiteCopy(copy: typeof import("./affiliate-disclosure")): string {
  return [
    copy.siteLinkNote,
    copy.siteLinkNoteShort,
    copy.disclosureStatusParagraph,
    copy.revenueModelParagraph,
    copy.linkHandlingParagraph,
    copy.sellerNeutralityParagraph,
    copy.disclosureMetaDescription,
  ].join("\n");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("제휴 공개 문구 — 파트너스 ID 미설정 빌드", () => {
  it("AFFILIATE_ENABLED가 false이고 비제휴 단정이 참으로 남는다", async () => {
    const { copy, config } = await loadCopy("");
    expect(config.AFFILIATE_ENABLED).toBe(false);
    expect(config.COUPANG_PARTNER_ID).toBeNull();
    expect(copy.siteLinkNote).toContain("현재 공개된 모든 가격 링크는 비제휴입니다");
    expect(copy.disclosureStatusParagraph).toContain("현재 모든 가격·판매처 링크는 비제휴입니다");
    expect(copy.revenueModelParagraph).toContain("수익원은 광고 하나뿐");
  });

  it("빈 값·공백·플레이스홀더는 전부 비제휴 모드로 떨어진다", async () => {
    // env 슬롯이 비어 별칭 문자열이 그대로 들어간 사고를 이 함대는 이미 냈다.
    for (const raw of ["", "   ", "YOUR_PARTNER_ID", "AF", "AF12"]) {
      const { config } = await loadCopy(raw);
      expect(config.AFFILIATE_ENABLED).toBe(false);
      vi.unstubAllEnvs();
    }
  });
});

describe("제휴 공개 문구 — 파트너스 ID 설정 빌드", () => {
  it("사이트 전역 비제휴 단정이 한 문장도 남지 않는다", async () => {
    const { copy, config } = await loadCopy("AF1234567");
    expect(config.AFFILIATE_ENABLED).toBe(true);
    expect(config.COUPANG_PARTNER_ID).toBe("AF1234567");
    const text = allSiteCopy(copy);
    const offending = (FORBIDDEN_BLANKET_CLAIMS as string[]).filter((claim) => text.includes(claim));
    expect(offending).toEqual([]);
  });

  it("수수료 수취와 추적 파라미터를 숨기지 않고 적는다", async () => {
    const { copy } = await loadCopy("AF1234567");
    expect(copy.disclosureStatusParagraph).toContain("일정액의 수수료를 받습니다");
    expect(copy.revenueModelParagraph).toContain("쿠팡 파트너스 제휴 수수료");
    expect(copy.linkHandlingParagraph).toContain("lptag");
    expect(copy.linkHandlingParagraph).toContain("subid");
  });

  it("대가성 고지 문구가 쿠팡 파트너스와 수수료 수취를 모두 명시한다", async () => {
    const { copy } = await loadCopy("AF1234567");
    expect(copy.COUPANG_DISCLOSURE_SENTENCE).toContain("쿠팡 파트너스");
    expect(copy.COUPANG_DISCLOSURE_SENTENCE).toContain("수수료를 제공받습니다");
  });
});

describe("링크 단위 라벨", () => {
  it("제휴/비제휴를 링크마다 구분해 표시한다", async () => {
    const { copy } = await loadCopy("AF1234567");
    expect(copy.linkBadgeLabel(true)).toBe("제휴 링크");
    expect(copy.linkBadgeLabel(false)).toBe("비제휴 링크");
    expect(copy.offerLinkLabel(true)).toContain("제휴");
    expect(copy.offerLinkLabel(false)).toContain("비제휴");
  });
});

describe("두 모드에서 모두 참이어야 하는 문장", () => {
  it("순위 독립성 선언은 모드와 무관하게 같고 항상 노출된다", async () => {
    const off = await loadCopy("");
    const offSentence = off.copy.RANKING_INDEPENDENCE_SENTENCE;
    const offNote = off.copy.siteLinkNote;
    vi.unstubAllEnvs();
    const on = await loadCopy("AF1234567");
    expect(offSentence).toBe(on.copy.RANKING_INDEPENDENCE_SENTENCE);
    expect(offNote).toContain(offSentence);
    expect(on.copy.siteLinkNote).toContain(on.copy.RANKING_INDEPENDENCE_SENTENCE);
  });
});
