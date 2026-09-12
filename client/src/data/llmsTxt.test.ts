import { describe, expect, it } from "vitest";
import llmsTxt from "../../public/llms.txt?raw";
import { OVERDUE_AFTER_DAYS, PRICE_CAPTURED_AT, REFRESH_REQUIRED_AFTER_DAYS } from "./price-freshness";
import { publicDataSnapshot } from "./public-snapshot";
import { routes } from "@/router";
// @ts-expect-error — 빌드 스크립트 ESM 모듈(타입 선언 없음)
import { FORBIDDEN_BLANKET_CLAIMS } from "../../scripts/affiliate-honesty-rules.mjs";

// llms.txt는 크롤러가 읽는 정적 텍스트라 빌드 시 아무것도 생성해주지 않는다. 여기서
// 실제 코드가 읽는 상수를 import해 텍스트와 직접 대조해야 한다 — 날짜를 손으로 옮겨 적으면
// price-freshness.ts의 값이 바뀌어도 llms.txt는 조용히 낡는다(과거 "미발동 규칙 공개" 결함과
// 같은 계열). `?raw`로 public/llms.txt를 그대로 문자열 import한다(node:fs 불필요 — 이 저장소에는
// @types/node가 없어 fs를 쓰면 vue-tsc가 깨진다).

// 라우터가 실제로 등록한 정적 페이지만 "주요 페이지" 후보로 삼는다. 동적 상세
// (/categories/:slug, /products/:slug)와 /404, 캐치올은 llms.txt에서 예시로만
// 언급하고(마크다운 링크가 아닌 인라인 코드로) 이 목록에서는 뺀다.
const CORE_STATIC_ROUTES = routes
  .map((route) => route.path)
  .filter((path) => !path.includes(":") && path !== "/404");

describe("client/public/llms.txt", () => {
  it("링크된 경로가 라우터의 정적 페이지와 정확히 일치한다 (빠짐도 추가도 없이)", () => {
    const linkedPaths = [
      ...llmsTxt.matchAll(/\]\(https:\/\/shakilabs\.com\/nutri([^)]*)\)/g),
    ].map((m) => m[1] || "/");

    const missing = CORE_STATIC_ROUTES.filter((route) => !linkedPaths.includes(route));
    const extra = linkedPaths.filter((route) => !CORE_STATIC_ROUTES.includes(route));

    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    expect(linkedPaths.length).toBe(CORE_STATIC_ROUTES.length);
  });

  it("사업자 공식 인증·실시간·정기 갱신을 주장하는 표현이 없다 (부정문 안 사용은 허용)", () => {
    const forbidden = [
      "실시간",
      "자동 갱신",
      "매일 갱신",
      "매주 갱신",
      "매달 갱신",
      "정기 갱신",
      "효능 검증",
      "치료 효과",
    ];
    const negationMarkers = ["않습니다", "않으며", "없으므로", "제공하지 않", "아니", "없습니다"];

    const offendingLines: string[] = [];
    llmsTxt.split("\n").forEach((line) => {
      forbidden.forEach((phrase) => {
        if (line.includes(phrase) && !negationMarkers.some((marker) => line.includes(marker))) {
          offendingLines.push(`[${phrase}] ${line.trim()}`);
        }
      });
    });

    expect(offendingLines).toEqual([]);
  });

  // llms.txt는 정적 파일 하나라 제휴 빌드와 비제휴 빌드가 같은 텍스트를 받는다.
  // 따라서 제휴 상태를 단정하면 둘 중 한쪽에서 반드시 거짓이 된다 — 양쪽에서 참인 문장만 쓴다.
  it("제휴 여부를 사이트 전역으로 단정하지 않는다", () => {
    const offending = (FORBIDDEN_BLANKET_CLAIMS as string[]).filter((claim) => llmsTxt.includes(claim));
    expect(offending).toEqual([]);
  });

  it("제휴 링크 표시 규칙과 순위 독립성을 함께 적는다", () => {
    expect(llmsTxt).toContain("쿠팡 파트너스 제휴 링크일 수 있습니다");
    expect(llmsTxt).toContain("순위 산식은 광고비·제휴 여부·판매자 수수료를 입력값으로 쓰지 않습니다");
  });

  it("가격 확인일·공공데이터 기준일·갱신 규칙 일수가 실제 상수와 같다", () => {
    // /methodology가 실제로 렌더하는 값 그대로다. 상수가 바뀌었는데 이 문자열을
    // 안 고치면 이 테스트가 그 순간 red가 되어야 한다.
    expect(llmsTxt).toContain(PRICE_CAPTURED_AT);
    expect(llmsTxt).toContain(publicDataSnapshot.dataReferenceDate);
    expect(llmsTxt).toContain(`${REFRESH_REQUIRED_AFTER_DAYS}일`);
    expect(llmsTxt).toContain(`${OVERDUE_AFTER_DAYS}일`);
  });
});
