import { formatActiveAmount } from "./category-catalog";
import { referenceCaveat, type DigestFinding } from "./category-digest-registry";
import type { AmountStats, ReferenceValue } from "./category-digest-stats";
import type { VerifiedStats } from "./verified-digest-stats";
import { count, isoDot, percent, roundWon, times } from "./digest-format";
import { formatUnitPriceAmount, formatUnitPriceWon, type UnitPriceRanking } from "./unit-price";

// 가격을 확인한 검증 제품(순위 산출물)에서 읽는 발견. 순위·가격·함량은 전부 resolveUnitPriceRanking의
// 결과를 그대로 쓴다 — 화면 위 순위표와 다른 계산을 하면 두 곳의 숫자가 어긋난다.

function amountOf(ranking: UnitPriceRanking, value: number): string {
  return formatUnitPriceAmount(value, ranking.category.activeUnit);
}

export function verifiedOrderFinding(ranking: UnitPriceRanking, stats: VerifiedStats): DigestFinding {
  const basis = ranking.category.basisLabel;
  const span = `${amountOf(ranking, stats.amounts.min)}~${amountOf(ranking, stats.amounts.max)}`;
  const dailySpan = `${formatUnitPriceWon(stats.dailyCost.min)}~${formatUnitPriceWon(stats.dailyCost.max)}`;
  if (stats.amounts.allSame) {
    return {
      id: "verified-order",
      title: `검증 제품 ${count(stats.count)}개 모두 1일 ${amountOf(ranking, stats.amounts.min)}`,
      body: `함량이 같으니 ${basis} 가격 순서는 1일 비용 순서와 그대로 겹칩니다. 1일 비용 ${dailySpan}의 차이가 곧 순위 차이입니다.`,
    };
  }
  if (stats.firstDivergence === null) {
    return {
      id: "verified-order",
      title: `1일 함량(${span})이 달라도 순서는 1일 비용과 같다`,
      body: `검증 제품 1일 함량은 ${span}(${times(stats.amounts.max / stats.amounts.min)})이지만, 1일 비용이 낮은 제품이 ${basis} 가격도 낮아 ${count(stats.count)}위까지 두 순서가 같습니다.`,
    };
  }
  const rank = stats.firstDivergence;
  const top = ranking.scores[0];
  if (rank === 1) {
    const cheap = stats.cheapestDaily;
    return {
      id: "verified-order",
      title: `1일 비용 1위와 ${basis} 가격 1위가 다른 제품이다`,
      body: `1일 비용 1위(${cheap.product.displayName}, ${formatUnitPriceWon(cheap.dailyCostKrw)})는 1일 함량 ${amountOf(ranking, cheap.product.dailyActiveAmount)} 기준으로 ${basis} 가격 ${cheap.rank}위입니다.`
        + ` ${basis} 가격 1위는 ${top.product.displayName}(1일 ${amountOf(ranking, top.product.dailyActiveAmount)})입니다.`,
    };
  }
  const same = rank === 2 ? "1위는" : `1~${rank - 1}위는`;
  return {
    id: "verified-order",
    title: `1일 비용 순서와 ${basis} 가격 순서가 ${rank}위부터 갈린다`,
    body: `${same} 같지만, ${rank}위는 1일 비용 기준 ${stats.byDailyCost[rank - 1].product.displayName}, ${basis} 가격 기준 ${ranking.scores[rank - 1].product.displayName}입니다.`
      + ` 검증 제품 1일 함량(${span})이 서로 달라 생기는 차이입니다.`,
  };
}

export function priceSpreadFinding(ranking: UnitPriceRanking, stats: VerifiedStats): DigestFinding {
  const basis = ranking.category.basisLabel;
  // 경계는 화면에 찍히는 값(소수 한 자리)으로 판정한다 — "2배에 머문다"와 "최대 2배 벌어진다"가
  // 같은 숫자로 동시에 나올 수 없게.
  const ratio = Math.round((stats.unitPrice.max / stats.unitPrice.min) * 10) / 10;
  const monthly = ranking.scores.map((score) => score.monthlyCostKrw);
  return {
    id: "price-spread",
    title: ratio >= 2
      ? `${basis} 가격이 최대 ${times(ratio)} 벌어진다`
      : `${basis} 가격 차이는 ${times(ratio)}에 머문다`,
    body: `${isoDot(ranking.updatedAt)}에 확인한 배송비 포함 1일 비용은 ${formatUnitPriceWon(stats.dailyCost.min)}~${formatUnitPriceWon(stats.dailyCost.max)}이고,`
      + ` 월 환산으로는 ${roundWon(Math.max(...monthly) - Math.min(...monthly))} 차이입니다.`
      + (ranking.scores.every((score) => score.unitPriceKrw === score.dailyCostKrw)
        ? ` 모든 제품의 1일 함량이 기준 단위와 같아 ${basis} 가격이 곧 1일 비용입니다.`
        : ` ${basis} 가격은 ${formatUnitPriceWon(stats.unitPrice.min)}~${formatUnitPriceWon(stats.unitPrice.max)}입니다.`),
  };
}

export function packageFinding(ranking: UnitPriceRanking, stats: VerifiedStats): DigestFinding {
  const top = ranking.scores[0];
  const longest = [...ranking.scores].sort((left, right) => right.totalDays - left.totalDays || left.rank - right.rank)[0];
  const { min, max } = stats.days;
  let title: string;
  const topPackage = top.product.packageLabel;
  if (min === max) title = `검증 제품 ${count(stats.count)}개 모두 ${count(min)}일분 포장`;
  else if (top.totalDays === max) title = `단위가격 1위가 가장 긴 ${count(max)}일분 포장(${topPackage})`;
  else if (top.totalDays === min) title = `단위가격 1위는 가장 짧은 ${count(min)}일분 포장(${topPackage})`;
  else title = `단위가격 1위는 ${count(top.totalDays)}일분, 포장은 ${count(min)}~${count(max)}일분`;
  const range = min === max ? `모두 ${count(min)}일분` : `${count(min)}~${count(max)}일분`;
  const longestNote = longest.rank !== 1
    ? ` 가장 긴 ${count(longest.totalDays)}일분(${longest.product.displayName})은 단위가격 ${longest.rank}위입니다.`
    : "";
  return {
    id: "package",
    title,
    body: `검증 제품 한 번 구매분은 ${range}이고, 단위가격 1위 구성은 ${top.product.packageLabel}(${top.product.servingLabel})입니다.${longestNote}`,
  };
}

export function shippingFinding(ranking: UnitPriceRanking, stats: VerifiedStats): DigestFinding {
  if (stats.shipped.length === 0) {
    const listed = ranking.scores.map((score) => score.product.offer.listedPriceKrw);
    return {
      id: "shipping",
      title: `검증 제품 ${count(stats.count)}개 모두 필수 배송비 없이 판매가 ${roundWon(Math.min(...listed))}~${roundWon(Math.max(...listed))}`,
      body: `필수 배송비가 붙은 제품이 없어 판매가 ${roundWon(Math.min(...listed))}~${roundWon(Math.max(...listed))}을`
        + ` ${count(stats.days.min)}~${count(stats.days.max)}일로 나눈 값이 그대로 1일 비용입니다.`,
    };
  }
  const [largest] = stats.shipped;
  const { listedPriceKrw, mandatoryShippingKrw } = largest.score.product.offer;
  const share = percent(mandatoryShippingKrw, listedPriceKrw + mandatoryShippingKrw);
  return {
    id: "shipping",
    title: `필수 배송비가 붙는 제품 ${count(stats.shipped.length)}개 — 최대 총액의 ${share}`,
    body: `배송비 비중이 가장 큰 제품(${largest.score.product.displayName})은 배송비 ${roundWon(mandatoryShippingKrw)}이`
      + ` 총액의 ${share}이고, 하루 ${formatUnitPriceWon(largest.perDay)}을 더합니다.`,
  };
}

export function verifiedVsRegistryFinding(
  ranking: UnitPriceRanking,
  stats: VerifiedStats,
  amounts: AmountStats,
  unit: "mg" | "ug",
  overlap: number,
): DigestFinding {
  const verifiedMedian = stats.amounts.median;
  const format = (value: number) => formatActiveAmount(value, unit);
  const head = `검증 제품 함량 중앙값 ${format(verifiedMedian)}`;
  let title = `${head} — 등록부와 같다`;
  if (verifiedMedian > amounts.median) title = `${head} — 등록부 ${format(amounts.median)}보다 높다`;
  else if (verifiedMedian < amounts.median) title = `${head} — 등록부 ${format(amounts.median)}보다 낮다`;
  return {
    id: "verified-vs-registry",
    title,
    body: `가격을 확인한 ${count(stats.count)}개의 1일 함량 중앙값 ${format(verifiedMedian)}은 등록부 ${count(amounts.values.length)}건 중앙값 ${format(amounts.median)}의 ${times(verifiedMedian / amounts.median)}입니다.`
      + ` 검증 제품 가운데 등록부에 같은 신고번호로 실린 제품은 ${count(overlap)}개입니다.`,
  };
}

export function verifiedReferenceFinding(
  ranking: UnitPriceRanking,
  stats: VerifiedStats,
  reference: ReferenceValue,
  withCaveat: boolean,
): DigestFinding {
  const multiples = ranking.scores.map((score) => score.product.dailyActiveAmount / reference.amount);
  const low = Math.min(...multiples);
  const high = Math.max(...multiples);
  const label = formatActiveAmount(reference.amount, reference.unit);
  let title: string;
  if (multiples.every((multiple) => multiple >= 1)) title = `검증 제품 ${count(stats.count)}개 모두 기준치 ${label} 이상`;
  else if (multiples.every((multiple) => multiple < 1)) title = `검증 제품 ${count(stats.count)}개 모두 기준치 ${label}보다 적다`;
  else title = `검증 제품 함량이 기준치 ${label} 위아래에 걸친다`;
  const range = low === high
    ? `검증 제품 ${count(stats.count)}개의 1일 함량은 모두 기준치의 ${times(low)}입니다.`
    : `검증 제품 1일 함량은 기준치의 ${times(low)}~${times(high)}입니다.`;
  return {
    id: "verified-reference",
    title,
    body: withCaveat ? `${range} ${referenceCaveat(reference)}` : range,
  };
}
