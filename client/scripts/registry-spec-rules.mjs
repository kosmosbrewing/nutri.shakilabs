// 기준규격(standardText)에서 카테고리별 1일 기능성분 함량을 추출한다.
// 건강기능식품 표시기준상 기능성분 표시량은 1일 섭취량 기준이므로 표시량 = 1일 함량으로 본다.
// 잘못된 숫자를 내보내느니 비우는 게 낫다 — 타당 범위(gate)를 벗어나면 null.

const AMOUNT = "([0-9][0-9,]*(?:\\.[0-9]+)?)";
const MG_UNIT = "(mg|㎎|g|그램)";

function toNumber(raw) {
  const value = Number(String(raw).replaceAll(",", ""));
  return Number.isFinite(value) ? value : null;
}

function toMilligrams(raw, unit) {
  const value = toNumber(raw);
  if (value === null) return null;
  return unit === "g" || unit === "그램" ? value * 1000 : value;
}

/** 성분 라벨 뒤 "표시량(123mg…)" 우선, 없으면 라벨 직후 첫 수치를 잡는다. */
function mgRule(labelPattern) {
  const primary = new RegExp(`${labelPattern}[^0-9]{0,40}?표시량[^0-9]{0,10}${AMOUNT}\\s*${MG_UNIT}`, "i");
  const fallback = new RegExp(`${labelPattern}[^0-9]{0,25}${AMOUNT}\\s*${MG_UNIT}`, "i");
  return (text) => {
    const match = text.match(primary) ?? text.match(fallback);
    return match ? toMilligrams(match[1], match[2].toLowerCase()) : null;
  };
}

/** CFU는 전체 자릿수("10,000,000,000") 또는 괄호 억 표기("100억")를 억 단위 숫자로 통일 */
function cfuRule() {
  const withDigits = new RegExp(`프로바이오틱스\\s*수[^0-9]{0,30}${AMOUNT}(?:\\s*\\(([0-9,]+(?:\\.[0-9]+)?)\\s*억\\))?\\s*(?:CFU|cfu)`);
  const withEok = /프로바이오틱스\s*수[^0-9]{0,30}([0-9,]+(?:\.[0-9]+)?)\s*억\s*(?:CFU|cfu)?/;
  return (text) => {
    const digits = text.match(withDigits);
    if (digits) {
      if (digits[2]) return toNumber(digits[2]);
      const raw = toNumber(digits[1]);
      if (raw === null) return null;
      // 억 미만 표기는 "10억" 같은 축약 — 1억 이상 전체 자릿수만 환산
      return raw >= 100_000_000 ? raw / 100_000_000 : raw;
    }
    const eok = text.match(withEok);
    return eok ? toNumber(eok[1]) : null;
  };
}

export const REGISTRY_SPEC_RULES = {
  probiotics: {
    unit: "억 CFU",
    extract: cfuRule(),
    // 고시 기능성 표시는 1억~100억이지만 보장균수 표기는 수천억까지 실재한다
    gate: [0.5, 10_000],
  },
  "omega-3": {
    unit: "mg",
    extract: mgRule("EPA\\s*[와및과]\\s*DHA의?\\s*합"),
    gate: [100, 4_000],
  },
  magnesium: {
    unit: "mg",
    extract: mgRule("마그네슘"),
    gate: [30, 1_000],
  },
  msm: {
    unit: "mg",
    extract: mgRule("(?:디메틸[설썰]폰|엠에스엠|MSM)"),
    gate: [200, 4_000],
  },
  "coenzyme-q10": {
    unit: "mg",
    extract: mgRule("코엔자임\\s*Q\\s*10"),
    gate: [10, 500],
  },
  "milk-thistle": {
    unit: "mg",
    // 공식 기록에 "실린마린" 오타가 실재한다
    extract: mgRule("실리?[니린]?마린"),
    gate: [30, 1_000],
  },
};

export function extractDailyAmount(slug, standardText) {
  const rule = REGISTRY_SPEC_RULES[slug];
  if (!rule) return { amount: null, reason: "no-rule" };
  const text = String(standardText ?? "");
  if (!text) return { amount: null, reason: "empty" };
  const amount = rule.extract(text);
  if (amount === null) return { amount: null, reason: "no-match" };
  const [min, max] = rule.gate;
  if (amount < min || amount > max) return { amount: null, reason: "out-of-range", raw: amount };
  return { amount, reason: "ok" };
}
