// Single source of truth for every published price-freshness fact.
// Why one file: the capture date used to be copy-pasted into five modules and the
// freshness rule was described in four Korean paragraphs that no build step compared
// against the code. Both the numbers and the sentences are derived from freshness.json
// here, so a rule change rewrites the published copy in the same commit.
//
// Korean strings live in this .ts module rather than in .vue templates on purpose:
// the brand font subset only scans .vue files and its 64 KiB budget is nearly full.
import { z } from "zod";
import freshnessInput from "./freshness.json";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

const freshnessSchema = z.object({
  schemaVersion: z.literal("price-freshness-v1"),
  capturedAt: dateSchema,
  asOf: dateSchema,
  refreshRequiredAfterDays: z.number().int().positive(),
  overdueAfterDays: z.number().int().positive(),
  // "grace" keeps overdue prices ranked behind a visible warning; "exclude" drops them
  // from every ranking. The published rule text below follows whichever value is set.
  overdueBehavior: z.enum(["grace", "exclude"]),
}).strict().refine(
  (value) => value.overdueAfterDays > value.refreshRequiredAfterDays,
  { message: "overdueAfterDays must be greater than refreshRequiredAfterDays" },
).refine(
  (value) => value.asOf >= value.capturedAt,
  { message: "asOf must not precede capturedAt" },
);

const parsed = freshnessSchema.safeParse(freshnessInput);
if (!parsed.success) {
  throw new Error(`Invalid price freshness policy: ${z.prettifyError(parsed.error)}`);
}
const policy = parsed.data;

/** The day a human re-verified every listed price. Every date constant reconciles to this. */
export const PRICE_CAPTURED_AT = policy.capturedAt;
export const REFRESH_REQUIRED_AFTER_DAYS = policy.refreshRequiredAfterDays;
export const OVERDUE_AFTER_DAYS = policy.overdueAfterDays;
export const OVERDUE_BEHAVIOR = policy.overdueBehavior;

// Build-time injection with a committed default. The default keeps the build
// deterministic (same commit renders the same HTML); VITE_NUTRI_PRICE_AS_OF lets a
// release or a gate rehearsal evaluate the rule against a different calendar day.
const injectedAsOf = dateSchema.safeParse(import.meta.env.VITE_NUTRI_PRICE_AS_OF);

/** The calendar day this build evaluates freshness against. */
export const PRICE_AS_OF = injectedAsOf.success && injectedAsOf.data >= policy.capturedAt
  ? injectedAsOf.data
  : policy.asOf;

export const priceFreshnessBadgeLabels = {
  fresh: "최신 가격",
  refresh_required: "갱신 필요",
  overdue: "기준일 경과",
} as const;

export function priceFreshnessBadgeTitle(ageDays: number): string {
  return `가격 확인일로부터 ${ageDays}일 지났습니다`;
}

export const priceFreshnessNoticeTitles = {
  refresh_required: "가격 갱신 필요",
  overdue: "기준일 경과 · 재확인 전",
} as const;

export function priceFreshnessNoticeBody(
  state: "refresh_required" | "overdue",
  ageDays: number,
): string {
  if (state === "refresh_required") {
    return `가격 확인일로부터 ${ageDays}일 지났습니다.`
      + ` 확인일이 ${REFRESH_REQUIRED_AFTER_DAYS}일을 넘긴 가격에는 갱신 필요 표시를 붙이고 계산은 그대로 유지합니다.`;
  }
  if (OVERDUE_BEHAVIOR === "exclude") {
    return `가격 확인일로부터 ${ageDays}일 지나 ${OVERDUE_AFTER_DAYS}일 기준을 넘겼습니다.`
      + " 기준을 넘긴 가격은 순위 계산에서 빠집니다.";
  }
  return `가격 확인일로부터 ${ageDays}일 지나 ${OVERDUE_AFTER_DAYS}일 기준을 넘겼습니다.`
    + " 이 값은 순위에서 자동으로 빠지지 않습니다. 사람이 판매 페이지를 다시 확인할 때까지"
    + " 한시적으로 유예하며, 유예 중이라는 사실을 지금 이 자리에 그대로 적습니다."
    + " 재확인이 끝나면 확인일이 갱신되어 이 표시는 사라집니다.";
}

// The four rules published on /methodology. Numbers and behaviour come from the same
// object the ranking code reads, and verify-price-freshness.mjs re-derives them from
// freshness.json to prove the rendered page still says what the code does.
export const priceFreshnessRules: readonly { id: string; term: string; detail: string }[] = [
  {
    id: "fresh",
    term: `0~${REFRESH_REQUIRED_AFTER_DAYS}일`,
    detail: "확인일 기준 최신 가격으로 표시합니다.",
  },
  {
    id: "refresh_required",
    term: `${REFRESH_REQUIRED_AFTER_DAYS + 1}~${OVERDUE_AFTER_DAYS}일`,
    detail: "모든 가격 옆에 갱신 필요 표시를 붙이되 계산은 그대로 유지합니다.",
  },
  {
    id: "overdue",
    term: `${OVERDUE_AFTER_DAYS + 1}일 이상`,
    detail: OVERDUE_BEHAVIOR === "exclude"
      ? "가격이 오래된 제품은 순위 계산에서 제외합니다."
      : "순위에서 자동으로 빼지 않습니다. 대신 기준일 경과 경고를 순위 위에 함께 표시하고,"
        + " 사람이 가격을 다시 확인할 때까지 한시적으로 유예합니다."
        + ` 재확인이 끝나면 확인일이 갱신되어 0~${REFRESH_REQUIRED_AFTER_DAYS}일 상태로 돌아갑니다.`,
  },
  {
    id: "price-basis",
    term: "가격 기준",
    detail: "필수 배송비와 묶음 수량을 포함하며 쿠폰·회원가·카드 할인은 제외합니다.",
  },
];

export const priceFreshnessContractNote =
  "이 규칙은 문장이 아니라 순위 계산이 읽는 값에서 그대로 옮겨 옵니다."
  + " 화면에 붙은 표시가 규칙과 어긋나면 배포 검사가 빌드를 멈춥니다.";
