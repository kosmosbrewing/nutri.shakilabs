import { PRICE_CAPTURED_AT } from "./price-freshness";
import type { OfferSnapshot } from "./types";

const CAPTURED_AT = PRICE_CAPTURED_AT;

export const offers: OfferSnapshot[] = [
  ["centrum-men-50", 19900, 0, 1, "https://prod.danawa.com/info/?pcode=5824834", "centrum-men-evidence"],
  ["centrum-women-112", 39980, 0, 1, "https://prod.danawa.com/info/?pcode=109990749", "centrum-women-price"],
  ["centrum-silver-men-112", 31200, 3500, 1, "https://prod.danawa.com/info/?pcode=5979054", "centrum-silver-men-evidence"],
  ["centrum-silver-women-50", 23820, 3000, 1, "https://prod.danawa.com/info/?pcode=5825000", "centrum-silver-women-evidence"],
  ["alive-men-60", 23380, 2500, 1, "https://prod.danawa.com/info/?pcode=5323240", "alive-men-price"],
  ["alive-women-80", 21510, 3000, 1, "https://prod.danawa.com/info/?pcode=29239046", "alive-women-evidence"],
  ["alive-50-plus-60", 56450, 0, 2, "https://prod.danawa.com/info/?pcode=15515066", "alive-50-evidence"],
  ["alive-milk-thistle-60", 50790, 0, 2, "https://prod.danawa.com/info/?pcode=14844986", "alive-milk-price"],
  ["berocca-30", 12000, 5000, 1, "https://prod.danawa.com/info/?pcode=119684681", "berocca-price"],
  ["acebiome-multivitamin-60", 8380, 0, 1, "https://prod.danawa.com/info/?pcode=79073921", "acebiome-evidence"],
].map(([productId, listedPriceKrw, mandatoryShippingKrw, quantityMultiplier, url, sourceId]) => ({
  id: `offer-${productId}`,
  productId,
  seller: "공개 판매 페이지",
  listedPriceKrw,
  mandatoryShippingKrw,
  quantityMultiplier,
  capturedAt: CAPTURED_AT,
  url,
  affiliate: false,
  availability: "in_stock",
  sourceId,
})) as OfferSnapshot[];
