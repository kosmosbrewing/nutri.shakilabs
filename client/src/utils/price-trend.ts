import { priceHistory } from "@/data/price-history";

export interface PriceTrend {
  baselineDateLabel: string;
  baselineDailyCostKrw: number;
  changePercent: number;
}

// 직전 스냅샷 대비 1일 비용 변화. 스냅샷에 없는 제품(신규 편입)은 null.
export function buildPriceTrend(
  productId: string,
  totalDays: number,
  currentDailyCostKrw: number,
): PriceTrend | null {
  const snapshot = priceHistory.at(-1);
  const offer = snapshot?.offers[productId];
  if (!snapshot || !offer || totalDays <= 0 || currentDailyCostKrw <= 0) return null;
  const baseline = (offer.listedPriceKrw + offer.mandatoryShippingKrw)
    / (totalDays * offer.quantityMultiplier);
  if (baseline <= 0) return null;
  return {
    baselineDateLabel: snapshot.capturedAt.slice(5).replace("-", "."),
    baselineDailyCostKrw: Math.round(baseline),
    changePercent: ((currentDailyCostKrw - baseline) / baseline) * 100,
  };
}

export function formatTrendPercent(changePercent: number): string {
  const rounded = Math.round(changePercent);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded)}%`;
}
