import { describe, expect, it } from "vitest";
// @ts-expect-error — 빌드 스크립트 ESM 모듈(타입 선언 없음)을 회귀 테스트로만 잠근다
import { extractDailyAmount } from "../../scripts/registry-spec-rules.mjs";

describe("registry-spec-rules", () => {
  it("CFU 전체 자릿수와 괄호 억 표기를 억 단위로 통일한다", () => {
    expect(extractDailyAmount("probiotics",
      "2. 프로바이오틱스 수 : 표시량{10,000,000,000(100억)CFU/140mg} 이상").amount).toBe(100);
    expect(extractDailyAmount("probiotics",
      "프로바이오틱스 수: 1,000,000,000 CFU 이상").amount).toBe(10);
  });

  it("유니코드 ㎎ 단위와 g 환산을 처리한다", () => {
    expect(extractDailyAmount("milk-thistle",
      "3) 실리마린 : 표시량(130 ㎎/750 ㎎)의 80 ~120%").amount).toBe(130);
    expect(extractDailyAmount("msm",
      "2. 디메틸설폰(MSM) : 표시량(2 g/일)의 80~120%").amount).toBe(2000);
  });

  it("공식 기록의 실린마린 오타를 수용한다", () => {
    expect(extractDailyAmount("milk-thistle",
      "2) 실린마린 : 표시량(130 mg / 900 mg)의 80%~120%").amount).toBe(130);
  });

  it("EPA·DHA 합 표기 변형을 추출한다", () => {
    expect(extractDailyAmount("omega-3",
      "2. EPA 와 DHA의 합 : 표시량(1,000 mg/1,300 mg)의 80~120%").amount).toBe(1000);
  });

  it("타당 범위를 벗어나면 버린다 — 틀린 숫자보다 빈 칸이 낫다", () => {
    const result = extractDailyAmount("coenzyme-q10", "코엔자임Q10 : 표시량(9,000 mg)의 80%");
    expect(result.amount).toBeNull();
    expect(result.reason).toBe("out-of-range");
  });

  it("근거 텍스트가 없으면 null", () => {
    expect(extractDailyAmount("magnesium", "1. 성상 : 흰색 정제 2. 붕해 : 적합").reason).toBe("no-match");
  });
});
