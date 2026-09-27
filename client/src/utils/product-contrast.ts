import { nutrientReferences } from "@/data/nutrients";
import { formatCoverageRatio, formatNutrientAmount } from "./comparison";
import type { RankingItem } from "./ranking";

// 제품 상세 첫머리에 올리는 "이 제품만의 값". 같은 브랜드 제품끼리 페이지가 닮아 보이는 이유는
// 23행 영양소 표의 틀이 같아서다 — 그래서 표보다 먼저, 이 제품에서만 나오는 값을 보여 준다.
// 새 수치를 만들지 않고 value-v1 산출물(coverage)만 읽는다.

const nutrientNames = new Map(nutrientReferences.map((reference) => [reference.id, reference.name]));

function nameOf(nutrientId: string): string {
  return nutrientNames.get(nutrientId) ?? nutrientId;
}

export function formatDailyAmount(value: number, unit: string): string {
  return value === 0 ? "미표시" : `${formatNutrientAmount(value)}${unit === "ug" ? "μg" : "mg"}`;
}

export interface ReferenceVerdict {
  met: string[];
  below: { name: string; ratio: number; label: string }[];
  absent: string[];
}

/** 23개 영양소를 기준치 충족·미달·미표시로 가른다. 미달은 충족률이 낮은 순서. */
export function buildReferenceVerdict(item: RankingItem): ReferenceVerdict {
  const verdict: ReferenceVerdict = { met: [], below: [], absent: [] };
  for (const entry of item.score.coverage) {
    const name = nameOf(entry.nutrientId);
    if (entry.dailyAmount === 0) verdict.absent.push(name);
    else if (entry.ratio >= 1) verdict.met.push(name);
    else verdict.below.push({ name, ratio: entry.ratio, label: formatCoverageRatio(entry.ratio) });
  }
  verdict.below.sort((left, right) => left.ratio - right.ratio);
  return verdict;
}

export interface NutrientDifference {
  name: string;
  mine: string;
  theirs: string;
  magnitude: number;
}

export interface ClosestProduct {
  item: RankingItem;
  sameCount: number;
  differences: NutrientDifference[];
}

interface Candidate extends ClosestProduct {
  oneSided: number;
  distance: number;
}

function compare(item: RankingItem, other: RankingItem): Candidate {
  const own = new Map(item.score.coverage.map((entry) => [entry.nutrientId, entry]));
  const differences: NutrientDifference[] = [];
  let sameCount = 0;
  let oneSided = 0;
  let distance = 0;
  for (const entry of other.score.coverage) {
    const mine = own.get(entry.nutrientId);
    if (!mine) continue;
    if (mine.dailyAmount === entry.dailyAmount) {
      sameCount += 1;
      continue;
    }
    // 한쪽만 표시된 항목은 배수로 잴 수 없어 가장 큰 차이로 둔다
    const bothListed = mine.dailyAmount > 0 && entry.dailyAmount > 0;
    const magnitude = bothListed ? Math.abs(Math.log(mine.dailyAmount / entry.dailyAmount)) : Number.POSITIVE_INFINITY;
    if (bothListed) distance += magnitude;
    else oneSided += 1;
    differences.push({
      name: nameOf(entry.nutrientId),
      mine: formatDailyAmount(mine.dailyAmount, mine.unit),
      theirs: formatDailyAmount(entry.dailyAmount, entry.unit),
      magnitude,
    });
  }
  differences.sort((left, right) => right.magnitude - left.magnitude);
  return { item: other, sameCount, differences, oneSided, distance };
}

/**
 * 1일 함량이 똑같은 영양소가 가장 많은 제품. 같으면 한쪽만 표시된 항목이 적은 쪽,
 * 그다음 함량 배수 차이(로그)의 합이 작은 쪽, 마지막으로 가격효율 순위가 높은 쪽.
 */
export function findClosestProduct(item: RankingItem, items: RankingItem[]): ClosestProduct | null {
  const [closest] = items
    .filter((other) => other.product.id !== item.product.id)
    .map((other) => compare(item, other))
    .sort((left, right) => right.sameCount - left.sameCount
      || left.oneSided - right.oneSided
      || left.distance - right.distance
      || left.item.overallRank - right.item.overallRank);
  if (!closest) return null;
  return { item: closest.item, sameCount: closest.sameCount, differences: closest.differences };
}

export interface ContrastFinding {
  title: string;
  body: string;
}

export interface ProductContrast {
  verdict: ContrastFinding;
  closest: (ContrastFinding & { partner: RankingItem }) | null;
}

const LISTED_DIFFERENCES = 5;

export function buildProductContrast(item: RankingItem, items: RankingItem[]): ProductContrast {
  const verdict = buildReferenceVerdict(item);
  const total = item.score.coverage.length;
  const verdictBody = [
    `${total}개 영양소 가운데 1일 영양성분 기준치를 채운 항목은 ${verdict.met.length}개입니다.`,
    verdict.below.length > 1
      ? `기준치에 못 미친 ${verdict.below.length}개는 충족률이 낮은 순서로 ${verdict.below.map(({ name, label }) => `${name} ${label}`).join(", ")}입니다.`
      : null,
    verdict.below.length === 1
      ? `기준치에 못 미친 항목은 ${verdict.below[0].name} ${verdict.below[0].label} 하나입니다.`
      : null,
    verdict.absent.length > 0
      ? `전체 라벨에 표시가 없는 ${verdict.absent.length}개는 ${verdict.absent.join(", ")}입니다.`
      : null,
  ].filter((sentence): sentence is string => sentence !== null).join(" ");

  const closest = findClosestProduct(item, items);
  let closestFinding: ProductContrast["closest"] = null;
  if (closest) {
    const partnerName = closest.item.product.officialName;
    const shown = closest.differences.slice(0, LISTED_DIFFERENCES)
      .map(({ name, mine, theirs }) => `${name} ${mine} 대 ${theirs}`).join(", ");
    const rest = closest.differences.length - LISTED_DIFFERENCES;
    const listed = `${shown}${rest > 0 ? ` 외 ${rest}개` : ""}`;
    closestFinding = closest.sameCount > 0
      ? {
        partner: closest.item,
        title: `가장 비슷한 제품과도 ${closest.differences.length}개 영양소가 다르다`,
        body: `1일 함량이 똑같은 영양소가 가장 많은 제품은 ${partnerName}(${total}개 중 ${closest.sameCount}개 같음)입니다.`
          + ` 다른 ${closest.differences.length}개를 차이가 큰 순서로 적으면 ${listed}입니다(이 제품 대 ${partnerName}).`,
      }
      : {
        partner: closest.item,
        title: "1일 함량이 똑같은 영양소를 가진 제품이 없다",
        body: `비교군 어느 제품과도 ${total}개 영양소의 1일 함량이 하나도 같지 않습니다.`
          + ` 배수 차이가 가장 작은 제품(${partnerName})과 견주면 ${listed}입니다(이 제품 대 ${partnerName}).`,
      };
  }
  const verdictTitle = `기준치 충족 ${verdict.met.length}개 · 미달 ${verdict.below.length}개 · 미표시 ${verdict.absent.length}개`;
  return { verdict: { title: verdictTitle, body: verdictBody }, closest: closestFinding };
}
