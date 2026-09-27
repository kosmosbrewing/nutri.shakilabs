import { nutrientReferences } from "@/data/nutrients";
import { catalogCategories, type CategoryCatalogEntry } from "./category-catalog";

// 종류 페이지 다이제스트의 숫자 계층. 문장은 category-digest.ts가 만들고, 여기서는
// 등록부(공공데이터 스냅샷)와 검증 제품 순위 산출물만 읽어 수치를 낸다 — 손으로 적은 수치는 없다.

export interface CountedLabel { label: string; count: number }
export interface RecordRef { name: string; servingSize: string; dailyFrequency: string }

export interface RegistryStats {
  registryCount: number;
  rawRows: number;
  allCategoriesTotal: number;
  sizeRank: number;
  units: CountedLabel[];
  // 1회 섭취량 표기 그대로("1캡슐"·"2정")의 빈도 — 단위가 하나뿐인 종류에서 개수 분포를 말할 때 쓴다
  servingCounts: CountedLabel[];
  unreadableServings: number;
  frequency: { once: number; twice: number; threePlus: number; unreadable: number };
  singleUnitOnce: number;
  maxPills: { perDay: number; record: RecordRef } | null;
  manufacturers: { rawNames: number; distinct: number; top: CountedLabel; singles: number };
}

export interface AmountStats {
  values: number[];
  zeros: number;
  missing: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mode: { value: number; count: number };
}

export function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// 최근접 순위 백분위: 정렬값의 ceil(p·n)번째. 보간하지 않아 늘 실제 등록 함량 중 하나가 나온다.
export function nearestRank(sorted: number[], percentile: number): number {
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

const SERVING_PATTERN = /^(\d+(?:\.\d+)?)\s*([^\d\s].*)$/;
const FREQUENCY_PATTERN = /^(\d+)\s*회$/;
const PILL_UNITS = new Set(["정", "캡슐"]);

export function parseServing(value: string): { count: number; unit: string } | null {
  const match = SERVING_PATTERN.exec(value.trim());
  return match ? { count: Number(match[1]), unit: match[2].trim() } : null;
}

export function parseFrequency(value: string): number | null {
  const match = FREQUENCY_PATTERN.exec(value.trim());
  return match ? Number(match[1]) : null;
}

// 띄어쓰기·마침표·법인 표기만 다른 제조사 이름을 한 곳으로 묶는 키
export function manufacturerKey(name: string): string {
  return name.toUpperCase().replace(/주식회사|\(주\)|㈜/g, "").replace(/[^0-9A-Z가-힣]/g, "");
}

// 대표 표기는 9개 종류 등록부 전체에서 고른다: 띄어쓴 이름(읽기 쉬운 쪽)을 먼저, 같으면 더 자주 쓰인 표기.
// 한 종류에 붙여 쓴 표기만 있어도 다른 종류에 띄어 쓴 원문이 있으면 그 원문을 보여 준다.
const manufacturerDisplayNames = (() => {
  const variants = new Map<string, Map<string, number>>();
  for (const record of catalogCategories.flatMap((entry) => entry.registry)) {
    const key = manufacturerKey(record.manufacturer);
    const counts = variants.get(key) ?? new Map<string, number>();
    counts.set(record.manufacturer, (counts.get(record.manufacturer) ?? 0) + 1);
    variants.set(key, counts);
  }
  return new Map([...variants.entries()].map(([key, counts]) => [key, [...counts.entries()].sort((left, right) =>
    right[0].split(" ").length - left[0].split(" ").length || right[1] - left[1] || left[0].localeCompare(right[0]))[0][0]]));
})();

function byCountThenLabel(left: CountedLabel, right: CountedLabel): number {
  return right.count - left.count || left.label.localeCompare(right.label, "ko");
}

export function buildRegistryStats(category: CategoryCatalogEntry): RegistryStats {
  const registry = category.registry;
  const unitCounts = new Map<string, number>();
  const servingCounts = new Map<string, number>();
  let unreadableServings = 0;
  const frequency = { once: 0, twice: 0, threePlus: 0, unreadable: 0 };
  let singleUnitOnce = 0;
  let maxPills: RegistryStats["maxPills"] = null;
  for (const record of registry) {
    const serving = parseServing(record.servingSize);
    const perDay = parseFrequency(record.dailyFrequency);
    if (serving) {
      unitCounts.set(serving.unit, (unitCounts.get(serving.unit) ?? 0) + 1);
      const label = `${serving.count}${serving.unit}`;
      servingCounts.set(label, (servingCounts.get(label) ?? 0) + 1);
    } else unreadableServings += 1;
    if (perDay === null) frequency.unreadable += 1;
    else if (perDay === 1) frequency.once += 1;
    else if (perDay === 2) frequency.twice += 1;
    else frequency.threePlus += 1;
    if (serving && perDay === 1 && serving.count === 1) singleUnitOnce += 1;
    if (serving && perDay !== null && PILL_UNITS.has(serving.unit)) {
      const pills = serving.count * perDay;
      if (!maxPills || pills > maxPills.perDay) {
        maxPills = { perDay: pills, record: { name: record.name, servingSize: record.servingSize, dailyFrequency: record.dailyFrequency } };
      }
    }
  }
  const groups = new Map<string, number>();
  for (const record of registry) {
    const key = manufacturerKey(record.manufacturer);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  const manufacturerCounts = [...groups.entries()]
    .map(([key, total]) => ({ label: manufacturerDisplayNames.get(key) ?? key, count: total }))
    .sort(byCountThenLabel);
  const sizes = catalogCategories.map((entry) => entry.registry.length);
  return {
    registryCount: registry.length,
    rawRows: category.recordCount,
    allCategoriesTotal: sizes.reduce((sum, size) => sum + size, 0),
    sizeRank: 1 + sizes.filter((size) => size > registry.length).length,
    units: [...unitCounts.entries()].map(([label, count]) => ({ label, count })).sort(byCountThenLabel),
    servingCounts: [...servingCounts.entries()].map(([label, count]) => ({ label, count })).sort(byCountThenLabel),
    unreadableServings,
    frequency,
    singleUnitOnce,
    maxPills,
    manufacturers: {
      rawNames: new Set(registry.map((record) => record.manufacturer)).size,
      distinct: manufacturerCounts.length,
      top: manufacturerCounts[0],
      singles: manufacturerCounts.filter(({ count }) => count === 1).length,
    },
  };
}

// 스냅샷에 함량 열이 있는 종류(비타민D·C·칼슘)만. 0으로 적힌 값은 "함량 없음"이 아니라
// 기재 오류일 수 있어(예: 제품명은 5000IU인데 0) 분포에서 빼고 건수를 따로 밝힌다.
export function buildAmountStats(category: CategoryCatalogEntry): AmountStats | null {
  if (!category.activeUnit) return null;
  const amounts = category.registry.map((record) => record.activeAmount);
  const values = amounts.filter((value): value is number => value !== null && value > 0).sort((a, b) => a - b);
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [modeValue, modeCount] = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0] - right[0])[0];
  return {
    values,
    zeros: amounts.filter((value) => value === 0).length,
    missing: amounts.filter((value) => value === null).length,
    min: values[0],
    q1: nearestRank(values, 0.25),
    median: median(values),
    q3: nearestRank(values, 0.75),
    max: values[values.length - 1],
    mode: { value: modeValue, count: modeCount },
  };
}

export interface ReferenceValue { amount: number; unit: "mg" | "ug" }

// 식약처 1일 영양성분 기준치(sources: mfds-daily-reference)가 있는 종류만 — 종류 slug와 영양소 id가 같다.
export function referenceValueFor(slug: string, unit: string | null): ReferenceValue | null {
  const reference = nutrientReferences.find(({ id }) => id === slug);
  if (!reference || reference.canonicalUnit !== unit) return null;
  return { amount: reference.dailyTarget, unit: reference.canonicalUnit };
}
