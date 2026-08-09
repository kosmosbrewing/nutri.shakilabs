import { nutrientReferences } from "@/data/nutrients";
import { buildPriceTrend } from "./price-trend";
import type { RankingItem } from "./ranking";

// 제품별 서술은 전부 value-v1 산출물에서만 파생한다. 새 수치를 만들지 않는다.
// 한글 문장을 .ts에 두는 이유: 브랜드 폰트 서브셋은 .vue만 스캔하고 예산이 거의 찼다.
// 문장 틀은 짧게, 값은 길게 — 제품마다 결론이 갈리는 부분이 본문의 다수를 차지해야 한다.

export interface ProductNarrativeFact {
  label: string;
  value: string;
}

export interface ProductNarrative {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  factsHeading: string;
  facts: ProductNarrativeFact[];
  disclaimer: string;
}

const nutrientNames = new Map(nutrientReferences.map((reference) => [reference.id, reference.name]));

function won(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function one(value: number): string {
  return value.toFixed(1);
}

function name(nutrientId: string): string {
  return nutrientNames.get(nutrientId) ?? nutrientId;
}

function rankSentence(item: RankingItem, items: RankingItem[]): string {
  const best = items[0];
  const total = items.length;
  const share = Math.round(100 * item.score.valueIndex / best.score.valueIndex);
  if (item.overallRank === 1) {
    const second = items[1];
    return `가격효율지수 ${one(item.score.valueIndex)}로 ${total}개 중 1위입니다.`
      + ` 2위 ${second.product.officialName}은 ${one(second.score.valueIndex)}로 ${one(item.score.valueIndex - second.score.valueIndex)} 낮습니다.`;
  }
  if (item.overallRank <= 3) {
    return `가격효율지수 ${one(item.score.valueIndex)}로 ${total}개 중 ${item.overallRank}위, 1위 ${best.product.officialName}(${one(best.score.valueIndex)})의 ${share}% 수준입니다.`;
  }
  if (item.overallRank <= total - 3) {
    return `가격효율지수 ${one(item.score.valueIndex)}로 ${total}개 중 ${item.overallRank}위입니다. 1위 ${one(best.score.valueIndex)}의 ${share}% 수준으로 중간 구간에 놓였습니다.`;
  }
  return `가격효율지수 ${one(item.score.valueIndex)}로 ${total}개 중 ${item.overallRank}위, 1위 ${one(best.score.valueIndex)}의 ${share}% 수준입니다. 하위 구간인 이유는 아래 두 값에서 갈립니다.`;
}

function costSentence(item: RankingItem, items: RankingItem[]): string {
  const costs = items.map((entry) => entry.score.dailyCostKrw).sort((left, right) => left - right);
  const median = costs[Math.floor(costs.length / 2)];
  const days = item.product.totalDays * item.offer.quantityMultiplier;
  const diff = item.score.dailyCostKrw - median;
  const position = diff < 0
    ? `중앙값 ${won(median)}보다 ${won(Math.abs(diff))} 낮고`
    : diff > 0
      ? `중앙값 ${won(median)}보다 ${won(diff)} 높고`
      : `중앙값과 같고`;
  const shipping = item.offer.mandatoryShippingKrw > 0
    ? ` 필수 배송비 ${won(item.offer.mandatoryShippingKrw)}이 하루치를 ${won(item.offer.mandatoryShippingKrw / days)} 올렸습니다.`
    : ` 필수 배송비가 없어 판매가 ${won(item.offer.listedPriceKrw)}만으로 정해집니다.`;
  const packaging = item.offer.quantityMultiplier > 1
    ? ` 묶음 ${item.offer.quantityMultiplier}개를 합쳐 ${days}일로 나눈 값입니다.`
    : ` ${days}일치 한 통 기준입니다.`;
  return `배송비 포함 1일 ${won(item.score.dailyCostKrw)}, 월 ${won(item.score.monthlyCostKrw)}입니다.`
    + ` ${position} 가장 싼 ${won(costs[0])}과는 30일에 ${won((item.score.dailyCostKrw - costs[0]) * 30)} 벌어집니다.`
    + packaging + shipping;
}

function coverageSentence(item: RankingItem, items: RankingItem[]): string {
  const average = items.reduce((sum, entry) => sum + entry.score.coverageScore, 0) / items.length;
  const diff = item.score.coverageScore - average;
  const met = item.score.coverage.filter((entry) => entry.ratio >= 1).length;
  const absent = item.score.coverage.filter((entry) => entry.dailyAmount === 0).length;
  const gap = diff >= 0
    ? `평균 ${one(average)}%보다 ${one(diff)}%p 높습니다.`
    : `평균 ${one(average)}%보다 ${one(Math.abs(diff))}%p 낮습니다.`;
  const tier = item.score.coverageScore >= 85
    ? `기준치를 채운 항목이 ${met}개로 촘촘한 편입니다.`
    : item.score.coverageScore >= 60
      ? `기준치를 채운 항목은 ${met}개로 중간입니다.`
      : `기준치를 채운 항목이 ${met}개뿐이라 종합형보다 특정 성분 중심에 가깝습니다.`;
  const missing = absent === 0
    ? ` 전체 라벨에서 빠진 항목은 없습니다.`
    : ` 전체 라벨에 ${absent}개가 없어 0으로 반영했고 그만큼 평균이 내려갔습니다.`;
  return `영양충족도 ${one(item.score.coverageScore)}%. ${gap} ${tier}${missing}`;
}

function trendSentence(item: RankingItem): string | null {
  const trend = buildPriceTrend(item.product.id, item.product.totalDays, item.score.dailyCostKrw);
  if (!trend) return null;
  const rounded = Math.round(trend.changePercent);
  if (rounded <= -1) {
    return `직전 ${trend.baselineDateLabel} 스냅샷의 ${won(trend.baselineDailyCostKrw)}에서 ${Math.abs(rounded)}% 내렸습니다.`;
  }
  if (rounded >= 1) {
    return `직전 ${trend.baselineDateLabel} 스냅샷의 ${won(trend.baselineDailyCostKrw)}에서 ${rounded}% 올랐습니다.`;
  }
  return `직전 ${trend.baselineDateLabel} 스냅샷의 ${won(trend.baselineDailyCostKrw)}과 견줘 변동이 없습니다.`;
}

function packageSentence(item: RankingItem): string {
  const days = item.product.totalDays * item.offer.quantityMultiplier;
  const perUnit = (item.offer.listedPriceKrw + item.offer.mandatoryShippingKrw) / (item.product.totalUnits * item.offer.quantityMultiplier);
  if (item.offer.mandatoryShippingKrw > 0) {
    const share = 100 * item.offer.mandatoryShippingKrw / (item.offer.listedPriceKrw + item.offer.mandatoryShippingKrw);
    return `한 통 ${item.product.totalUnits}정으로 ${days}일을 채우며 1정당 ${won(perUnit)}입니다.`
      + ` 총액의 ${one(share)}%가 배송비라, 같은 판매가라도 한 번에 사는 양이 적을수록 하루 비용이 올라갑니다.`;
  }
  return `한 통 ${item.product.totalUnits}정으로 ${days}일을 채우며 1정당 ${won(perUnit)}입니다.`
    + ` 배송비가 0원이라 판매가 ${won(item.offer.listedPriceKrw)}이 그대로 ${days}일에 나뉩니다.`;
}

function dominanceSentence(item: RankingItem, items: RankingItem[]): string {
  const better = items.filter((entry) =>
    entry.product.id !== item.product.id
    && entry.score.dailyCostKrw < item.score.dailyCostKrw
    && entry.score.coverageScore > item.score.coverageScore);
  if (better.length === 0) {
    return `1일 비용과 영양충족도를 동시에 앞서는 제품은 비교군에 없습니다. 더 싼 쪽은 충족도가 낮고, 충족도가 높은 쪽은 더 비쌉니다.`;
  }
  const cheapest = [...better].sort((left, right) => left.score.dailyCostKrw - right.score.dailyCostKrw)[0];
  return `1일 비용이 더 낮으면서 영양충족도까지 높은 제품이 ${better.length}개 있습니다.`
    + ` 그중 가장 싼 ${cheapest.product.officialName}은 1일 ${won(cheapest.score.dailyCostKrw)}·충족도 ${one(cheapest.score.coverageScore)}%로 하루 ${won(item.score.dailyCostKrw - cheapest.score.dailyCostKrw)} 싸고 ${one(cheapest.score.coverageScore - item.score.coverageScore)}%p 높습니다.`;
}

// 기준치 대비 표시 함량이 비교군에서 가장 큰 항목. 충족률 상한 이전의 원값으로 판단한다.
function leadingNutrients(item: RankingItem, items: RankingItem[]): string[] {
  return item.score.coverage
    .filter((entry) => {
      const mine = entry.dailyAmount / entry.target;
      if (mine <= 0) return false;
      return items.every((other) => {
        const match = other.score.coverage.find((candidate) => candidate.nutrientId === entry.nutrientId);
        return !match || match.dailyAmount / match.target <= mine;
      });
    })
    .map((entry) => name(entry.nutrientId));
}

function amount(value: number, unit: string): string {
  const rounded = value >= 10 ? Math.round(value) : Number(value.toFixed(2));
  return `${rounded.toLocaleString("ko-KR")}${unit === "ug" ? "μg" : "mg"}`;
}

function buildFacts(item: RankingItem, items: RankingItem[]): ProductNarrativeFact[] {
  const leading = leadingNutrients(item, items);
  const byMultiple = [...item.score.coverage]
    .sort((left, right) => (right.dailyAmount / right.target) - (left.dailyAmount / left.target));
  const richest = byMultiple[0];
  const highest = byMultiple
    .slice(0, 5)
    .map((entry) => `${name(entry.nutrientId)} ${amount(entry.dailyAmount, entry.unit)} ${Math.round(100 * entry.dailyAmount / entry.target).toLocaleString("ko-KR")}%`);
  const lowest = item.score.coverage
    .filter((entry) => entry.ratio < 1 && entry.dailyAmount > 0)
    .sort((left, right) => left.ratio - right.ratio)
    .slice(0, 5)
    .map((entry) => `${name(entry.nutrientId)} ${amount(entry.dailyAmount, entry.unit)} 대 기준 ${amount(entry.target, entry.unit)} ${Math.round(entry.ratio * 100)}%`);
  const met = item.score.coverage.filter((entry) => entry.ratio >= 1).length;
  const monthly = items.map((entry) => entry.score.monthlyCostKrw).sort((left, right) => left - right);
  const above = items[item.overallRank - 2];
  const below = items[item.overallRank];
  const neighbours = [
    above ? `위 ${above.overallRank}위 ${above.product.officialName} 지수 ${one(above.score.valueIndex)}` : null,
    below ? `아래 ${below.overallRank}위 ${below.product.officialName} 지수 ${one(below.score.valueIndex)}` : null,
  ].filter(Boolean).join(" · ");
  const absent = item.score.coverage
    .filter((entry) => entry.dailyAmount === 0)
    .map((entry) => name(entry.nutrientId));
  const siblings = items.filter((entry) =>
    entry.product.brand === item.product.brand && entry.product.id !== item.product.id);
  const days = item.product.totalDays * item.offer.quantityMultiplier;

  const facts: ProductNarrativeFact[] = [
    { label: "순위 이웃", value: neighbours },
  ];
  // 값이 "없음"으로만 찍히는 줄은 아예 빼서 제품마다 표의 구성 자체가 갈리게 한다.
  if (leading.length > 0) {
    facts.push({ label: "비교군 최고 함량 항목", value: leading.join(", ") });
  }
  facts.push({
    label: "기준치 대비 높은 항목",
    value: `${highest.join(", ")} · 가장 높은 ${name(richest.nutrientId)}도 충족률은 100%에서 끊습니다`,
  });
  if (lowest.length > 0) {
    facts.push({ label: "충족률이 낮은 항목", value: lowest.join(", ") });
  }
  if (absent.length > 0) {
    facts.push({ label: "전체 라벨 미표시", value: `${absent.length}개 · ${absent.join(", ")}` });
  }
  if (met > 0) {
    facts.push({
      label: "충족 항목 1개당 하루 비용",
      value: `${won(item.score.dailyCostKrw / met)} · 하루 ${won(item.score.dailyCostKrw)}을 기준치를 채운 ${met}개로 나눈 값`,
    });
  }
  if (siblings.length > 0) {
    facts.push({
      label: `같은 ${item.product.brand} 제품`,
      value: siblings.map((entry) => `${entry.product.officialName} ${entry.overallRank}위`).join(", "),
    });
  }
  facts.push({
    label: "월 비용 위치",
    value: `${won(item.score.monthlyCostKrw)} · 비교군 ${won(monthly[0])}~${won(monthly[monthly.length - 1])} 가운데 싼 쪽에서 ${monthly.indexOf(item.score.monthlyCostKrw) + 1}번째`,
  });
  facts.push({
    label: "가격 계산 조건",
    value: `${won(item.offer.listedPriceKrw)} + 배송비 ${won(item.offer.mandatoryShippingKrw)} ÷ ${days}일`
      + `${item.offer.quantityMultiplier > 1 ? ` · 묶음 ${item.offer.quantityMultiplier}개` : ""} · ${item.offer.capturedAt} 확인`,
  });
  return facts;
}

export function buildProductNarrative(item: RankingItem, items: RankingItem[]): ProductNarrative {
  const paragraphs = [
    rankSentence(item, items),
    costSentence(item, items),
    coverageSentence(item, items),
    packageSentence(item),
    dominanceSentence(item, items),
    trendSentence(item),
  ].filter((paragraph): paragraph is string => Boolean(paragraph));

  return {
    eyebrow: "Where this product lands",
    heading: "이 제품의 순위가 이렇게 나온 이유",
    paragraphs,
    factsHeading: "제품마다 갈리는 값",
    facts: buildFacts(item, items),
    disclaimer: "위 값은 표시 가격과 공개 라벨을 value-v1 산식에 넣은 계산 결과입니다. 효능이나 품질의 순위가 아닙니다.",
  };
}
