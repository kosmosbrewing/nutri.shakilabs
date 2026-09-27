import type { CategoryCatalogEntry } from "./category-catalog";
import { formatActiveAmount } from "./category-catalog";
import type { AmountStats, ReferenceValue, RegistryStats } from "./category-digest-stats";
import { count, isoDot, percent, times } from "./digest-format";

// 등록부(공공데이터 스냅샷)에서 읽는 발견. 제목은 값에서 분기한다 — 데이터가 바뀌어
// 방향이 뒤집히면 제목도 같이 뒤집혀야 하므로 고정 문구로 단정하지 않는다.

export interface DigestFinding {
  id: string;
  title: string;
  body: string;
}

function sizeRankPhrase(rank: number, total: number): string {
  if (rank === 1) return "규모가 가장 큽니다";
  if (rank === total) return "규모가 가장 작습니다";
  return `규모 ${rank}번째입니다`;
}

export function registrySizeFinding(
  category: CategoryCatalogEntry,
  stats: RegistryStats,
  categoryTotal: number,
  referenceDate: string,
): DigestFinding {
  const kept = stats.registryCount;
  const title = kept < stats.rawRows
    ? `원문 ${count(stats.rawRows)}행 중 ${count(kept)}건이 등록부에 남았다`
    : `원문 ${count(stats.rawRows)}행이 모두 등록부에 남았다`;
  return {
    id: "registry-size",
    title,
    body: `${isoDot(referenceDate)} 기준 공공데이터 분류 ‘${category.datasetLabel}’의 원문 ${count(stats.rawRows)}행 가운데,`
      + ` 제품명·신고번호·제조사가 모두 있고 신고번호가 겹치지 않는 ${count(kept)}건을 등록부로 싣습니다.`
      + ` ${categoryTotal}개 종류 등록부 ${count(stats.allCategoriesTotal)}건 중 ${percent(kept, stats.allCategoriesTotal)}로 ${sizeRankPhrase(stats.sizeRank, categoryTotal)}.`,
  };
}

export function servingUnitFinding(stats: RegistryStats): DigestFinding | null {
  if (stats.units.length === 0) return null;
  const [top, second] = stats.units;
  const readable = stats.registryCount - stats.unreadableServings;
  const list = stats.units.map(({ label, count: value }) => `${label} ${count(value)}건`).join(", ");
  const unreadable = stats.unreadableServings > 0
    ? ` 단위를 읽을 수 없는 표기 ${count(stats.unreadableServings)}건은 뺐습니다.`
    : "";
  if (stats.units.length === 1) {
    const [common] = stats.servingCounts;
    return {
      id: "serving-unit",
      title: `${count(top.count)}건 모두 ${top.label} 단위`,
      body: `신고된 1회 섭취량 ${count(top.count)}건이 전부 ${top.label} 단위로 적혀 있어, 이 종류에서는 섭취 단위로 제품이 갈리지 않습니다.`
        + ` 1회 ${common.label} 표기가 ${count(common.count)}건(${percent(common.count, readable)})입니다.${unreadable}`,
    };
  }
  const title = top.count * 2 >= readable
    ? `1회 섭취 단위는 ${top.label}, ${percent(top.count, readable)}로 가장 많다`
    : `가장 많은 단위(${top.label})도 ${percent(top.count, readable)} — 섭취 단위가 ${stats.units.length}가지로 갈린다`;
  const body = stats.units.length === 2
    ? `신고된 1회 섭취량 표기는 ${list}, 두 단위뿐입니다.`
    : `신고된 1회 섭취량 표기의 단위를 세면 ${list}입니다.`
      + ` 상위 두 단위(${top.label}·${second.label})가 ${percent(top.count + second.count, readable)}를 차지합니다.`;
  return { id: "serving-unit", title, body: `${body}${unreadable}` };
}

export function frequencyFinding(stats: RegistryStats): DigestFinding | null {
  const { once, twice, threePlus, unreadable } = stats.frequency;
  const readable = once + twice + threePlus;
  if (readable === 0) return null;
  const split = twice + threePlus;
  let title: string;
  if (split === 0) title = `${count(once)}건 모두 하루 한 번`;
  else if (once * 2 >= readable) title = `${count(readable)}건 중 ${percent(once, readable)}는 하루 한 번, ${count(split)}건은 나눠 먹는다`;
  else title = `${count(readable)}건 중 하루 두 번 이상 나눠 먹는 제품이 ${percent(split, readable)}`;
  const pills = stats.maxPills && stats.maxPills.perDay > 1
    ? ` 정·캡슐 제품 중 하루 개수가 가장 많은 것은 하루 ${count(stats.maxPills.perDay)}개(${stats.maxPills.record.name}, ${stats.maxPills.record.servingSize} × ${stats.maxPills.record.dailyFrequency})입니다.`
    : "";
  const skipped = unreadable > 0 ? ` 횟수 표기가 없는 ${count(unreadable)}건은 뺐습니다.` : "";
  return {
    id: "frequency",
    title,
    body: `섭취 횟수 표기는 하루 1회 ${count(once)}건, 2회 ${count(twice)}건, 3회 이상 ${count(threePlus)}건입니다.`
      + ` 1회 1개를 하루 한 번 먹는 제품은 ${count(stats.singleUnitOnce)}건(${percent(stats.singleUnitOnce, stats.registryCount)})입니다.`
      + pills + skipped,
  };
}

export function manufacturerFinding(stats: RegistryStats): DigestFinding {
  const { rawNames, distinct, top, singles } = stats.manufacturers;
  const title = top.count * 10 >= stats.registryCount
    ? `제조사 ${count(distinct)}곳 중 한 곳이 ${percent(top.count, stats.registryCount)}를 만든다`
    : `제조사 ${count(distinct)}곳 — 가장 많은 곳도 ${count(top.count)}건`;
  const merged = rawNames > distinct
    ? `표기만 다른 이름(띄어쓰기·마침표·법인 표기)을 합치면 제조사명 ${count(rawNames)}개가 ${count(distinct)}곳으로 줄어듭니다.`
    : `제조사명 ${count(rawNames)}개는 표기가 겹치지 않아 그대로 ${count(distinct)}곳입니다.`;
  return {
    id: "manufacturer",
    title,
    body: `${merged} 가장 많은 곳은 ${top.label}(${count(top.count)}건)이고, 등록 1건뿐인 곳이 ${count(singles)}곳입니다.`,
  };
}

export function amountFinding(stats: AmountStats, unit: "mg" | "ug" | "억 CFU"): DigestFinding {
  const format = (value: number) => formatActiveAmount(value, unit);
  const excluded = [
    stats.zeros > 0 ? ` 함량이 0으로 적힌 ${count(stats.zeros)}건은 분포에서 뺐습니다.` : "",
    stats.missing > 0 ? ` 함량 칸이 빈 ${count(stats.missing)}건도 뺐습니다.` : "",
  ].join("");
  return {
    id: "amount",
    title: `1일 함량 중앙값 ${format(stats.median)}, 최빈값 ${format(stats.mode.value)}`,
    body: `함량이 0보다 크게 적힌 ${count(stats.values.length)}건 기준 최저 ${format(stats.min)}, 최고 ${format(stats.max)}(${times(stats.max / stats.min)} 차이)이고,`
      + ` 가운데 절반은 ${format(stats.q1)}~${format(stats.q3)}에 있습니다.`
      + ` ${count(stats.mode.count)}건(${percent(stats.mode.count, stats.values.length)})이 최빈값 ${format(stats.mode.value)}에 몰려 있습니다.${excluded}`,
  };
}

export function referenceCaveat(reference: ReferenceValue): string {
  return `기준치 ${formatActiveAmount(reference.amount, reference.unit)}은 식품 표시에 쓰는 값이라, 이 비교가 개인에게 필요한 양이나 복용 권장을 뜻하지는 않습니다.`;
}

export function registryReferenceFinding(stats: AmountStats, reference: ReferenceValue): DigestFinding {
  const label = formatActiveAmount(reference.amount, reference.unit);
  const atOrAbove = stats.values.filter((value) => value >= reference.amount).length;
  const title = atOrAbove * 2 >= stats.values.length
    ? `${percent(atOrAbove, stats.values.length)}가 1일 영양성분 기준치 ${label} 이상`
    : `1일 영양성분 기준치 ${label} 이상은 ${count(atOrAbove)}건`;
  return {
    id: "registry-reference",
    title,
    body: `등록부 ${count(stats.values.length)}건의 중앙값은 기준치의 ${times(stats.median / reference.amount)}이고, 기준치 이상은 ${count(atOrAbove)}건입니다. ${referenceCaveat(reference)}`,
  };
}
