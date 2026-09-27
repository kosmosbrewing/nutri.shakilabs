import { median } from "./category-digest-stats";
import type { UnitPriceRanking, UnitPriceScore } from "./unit-price";

// 검증 제품(순위 산출물)의 수치 계층. 순위표와 같은 resolveUnitPriceRanking 결과만 읽는다.

export interface VerifiedStats {
  count: number;
  amounts: { min: number; max: number; median: number; allSame: boolean };
  dailyCost: { min: number; max: number };
  unitPrice: { min: number; max: number };
  cheapestDaily: UnitPriceScore;
  // 1일 비용 오름차순과 단위가격 순위가 처음 갈리는 순위(1부터). 끝까지 같으면 null
  firstDivergence: number | null;
  byDailyCost: UnitPriceScore[];
  days: { min: number; max: number };
  shipped: { score: UnitPriceScore; share: number; perDay: number }[];
}

export function buildVerifiedStats(ranking: UnitPriceRanking | null): VerifiedStats | null {
  const scores = ranking?.scores ?? [];
  if (scores.length === 0) return null;
  const amounts = scores.map((score) => score.product.dailyActiveAmount).sort((a, b) => a - b);
  // 안정 정렬: 1일 비용이 같으면 순위 순서를 유지하므로, 함량이 모두 같을 때 두 순서는 반드시 일치한다
  const byDailyCost = [...scores].sort((left, right) => left.dailyCostKrw - right.dailyCostKrw);
  const divergence = byDailyCost.findIndex((score, index) => score.product.id !== scores[index].product.id);
  const shipped = scores
    .filter((score) => score.product.offer.mandatoryShippingKrw > 0)
    .map((score) => {
      const { listedPriceKrw, mandatoryShippingKrw } = score.product.offer;
      return { score, share: mandatoryShippingKrw / (listedPriceKrw + mandatoryShippingKrw), perDay: mandatoryShippingKrw / score.totalDays };
    })
    .sort((left, right) => right.share - left.share);
  const days = scores.map((score) => score.totalDays);
  const dailyCosts = scores.map((score) => score.dailyCostKrw);
  const unitPrices = scores.map((score) => score.unitPriceKrw);
  return {
    count: scores.length,
    amounts: { min: amounts[0], max: amounts[amounts.length - 1], median: median(amounts), allSame: amounts[0] === amounts[amounts.length - 1] },
    dailyCost: { min: Math.min(...dailyCosts), max: Math.max(...dailyCosts) },
    unitPrice: { min: Math.min(...unitPrices), max: Math.max(...unitPrices) },
    cheapestDaily: byDailyCost[0],
    firstDivergence: divergence === -1 ? null : divergence + 1,
    byDailyCost,
    days: { min: Math.min(...days), max: Math.max(...days) },
    shipped,
  };
}
