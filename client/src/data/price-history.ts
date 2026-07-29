// 과거 가격 스냅샷 보관소 — 월 1회 가격 갱신 시 직전 offers 값을 여기에 추가한다.
// 현재가는 offers.ts가 유일한 원본이며, 이 파일은 갱신 이전 시점의 기록만 담는다.
export interface PriceHistoryOffer {
  listedPriceKrw: number;
  mandatoryShippingKrw: number;
  quantityMultiplier: number;
}

export interface PriceHistorySnapshot {
  capturedAt: string;
  offers: Record<string, PriceHistoryOffer>;
}

export const priceHistory: PriceHistorySnapshot[] = [
  {
    capturedAt: "2026-07-10",
    offers: {
      "centrum-men-50": { listedPriceKrw: 19900, mandatoryShippingKrw: 0, quantityMultiplier: 1 },
      "centrum-women-112": { listedPriceKrw: 34630, mandatoryShippingKrw: 3000, quantityMultiplier: 1 },
      "centrum-silver-men-112": { listedPriceKrw: 26600, mandatoryShippingKrw: 3500, quantityMultiplier: 1 },
      "centrum-silver-women-50": { listedPriceKrw: 23910, mandatoryShippingKrw: 0, quantityMultiplier: 1 },
      "alive-men-60": { listedPriceKrw: 23900, mandatoryShippingKrw: 0, quantityMultiplier: 1 },
      "alive-women-80": { listedPriceKrw: 18980, mandatoryShippingKrw: 3000, quantityMultiplier: 1 },
      "alive-50-plus-60": { listedPriceKrw: 56450, mandatoryShippingKrw: 0, quantityMultiplier: 2 },
      "alive-milk-thistle-60": { listedPriceKrw: 46530, mandatoryShippingKrw: 0, quantityMultiplier: 2 },
      "berocca-30": { listedPriceKrw: 14320, mandatoryShippingKrw: 0, quantityMultiplier: 1 },
      "acebiome-multivitamin-60": { listedPriceKrw: 23920, mandatoryShippingKrw: 0, quantityMultiplier: 1 },
    },
  },
];
