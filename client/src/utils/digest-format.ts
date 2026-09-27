// 다이제스트 문장의 숫자 표기. 문장마다 같은 규칙으로 찍어야 테스트가 숫자를 되짚을 수 있다.

const oneDecimal = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

export function count(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** 반올림이 0%·100%로 뭉개 "없다/전부"처럼 읽히는 경우만 소수 한 자리로 푼다. */
export function percent(part: number, whole: number): string {
  // 분모 0은 호출부 버그다 — 빌드(SSR)에서 바로 멈추게 해 "NaN%"가 배포되지 않게 한다
  if (!(whole > 0)) throw new Error(`percent() needs a positive whole, received ${whole}`);
  const exact = (100 * part) / whole;
  const rounded = Math.round(exact);
  const misleading = (part > 0 && rounded === 0) || (part < whole && rounded === 100);
  return `${misleading ? oneDecimal.format(exact) : rounded}%`;
}

export function times(ratio: number): string {
  return `${oneDecimal.format(ratio)}배`;
}

export function roundWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function isoDot(date: string): string {
  return date.replaceAll("-", ".");
}
