import { z } from "zod";

// 쿠팡 파트너스 ID의 단일 출처.
//
// Why in the data layer: 공개 문구(data/affiliate-disclosure.ts)와 URL 변환(utils/affiliate.ts)이
// **같은 값**을 봐야 한다. 레이어 규칙상 data는 utils를 import할 수 없으므로 값은 여기 둔다.
//
// Why an env var: 파트너스 ID(AF 코드)는 코드에 박지 않는다. 그리고 **미설정이면 원 URL이
// 그대로 나가야 한다** — 빈 값이 파라미터에 들어가면 수수료도 안 붙고 추적도 안 되는
// "제휴처럼 보이는" 링크가 조용히 배포된다(이 함대에서 실제로 난 사고 계열).

/** 쿠팡 파트너스 ID 원문("AF1234567" 또는 "1234567")을 정규형 "AF<digits>"로 만든다. */
export function resolvePartnerId(raw: unknown): string | null {
  const parsed = z
    .string()
    .trim()
    .transform((value) => value.replace(/^af/i, ""))
    .pipe(z.string().regex(/^[0-9]{4,12}$/))
    .safeParse(raw);
  return parsed.success ? `AF${parsed.data}` : null;
}

/** 빌드에 주입된 파트너스 ID. 미설정·형식 불일치는 모두 null(=비제휴 동작). */
export const COUPANG_PARTNER_ID = resolvePartnerId(import.meta.env.VITE_COUPANG_PARTNER_ID);

/** 이 빌드가 제휴 링크를 내보낼 수 있는가. 공개 문구가 갈리는 기준값. */
export const AFFILIATE_ENABLED = COUPANG_PARTNER_ID !== null;
