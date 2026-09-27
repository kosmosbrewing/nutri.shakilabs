import { describe, expect, it } from "vitest";
import catalogJson from "@/data/category-catalog.json";
import unitPriceJson from "@/data/unit-price-products.json";
import { nutrientReferences } from "@/data/nutrients";
import { catalogCategories } from "./category-catalog";
import { buildCategoryDigest, rankingOrderSentence, registryCaveatSentence, topScoreSentence } from "./category-digest";
import { resolveUnitPriceRanking } from "./unit-price";

// 실데이터 고정: 기대값은 엔진 헬퍼를 부르지 않고 JSON 원본에서 이 파일이 따로 계산한다.
// 엔진과 같은 함수로 기대값을 만들면 항등식이 되어 문장이 틀려도 초록불이 켜진다.

const SLUGS = catalogJson.categories.map((category) => category.slug);
const ko = (value: number) => value.toLocaleString("ko-KR");
const one = (value: number) => new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
const two = (value: number) => new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value);
const amountLabel = (value: number, unit: string) => `${two(value)} ${unit === "ug" ? "μg" : "mg"}`;

function load(slug: string) {
  const raw = catalogJson.categories.find((category) => category.slug === slug)!;
  const category = catalogCategories.find((entry) => entry.slug === slug)!;
  const ranking = resolveUnitPriceRanking(slug)!;
  const digest = buildCategoryDigest(category, ranking);
  const findings = new Map(digest.groups.flatMap((group) => group.findings).map((finding) => [finding.id, finding]));
  const included = new Set(ranking.scores.map((score) => score.product.id));
  const rawCategory = unitPriceJson.categories.find((entry) => entry.slug === slug)!;
  const products = rawCategory.products.filter((product) => included.has(product.id)).map((product) => {
    const days = product.totalUnitsPerPackage * product.offer.packageCount / product.unitsPerDay;
    const daily = (product.offer.listedPriceKrw + product.offer.mandatoryShippingKrw) / days;
    return { product, days, daily, unit: daily / (product.dailyActiveAmount / rawCategory.basisAmount) };
  });
  const byUnit = [...products].sort((left, right) => left.unit - right.unit);
  return { raw, category, ranking, digest, findings, products, byUnit, basis: rawCategory.basisLabel };
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const half = sorted.length / 2;
  return Number.isInteger(half) ? (sorted[half - 1] + sorted[half]) / 2 : sorted[Math.floor(half)];
}

describe("category digest — registry facts match the catalog JSON", () => {
  it.each(SLUGS)("%s: registry size, rank and filter direction", (slug) => {
    const { raw, findings } = load(slug);
    const finding = findings.get("registry-size")!;
    const kept = raw.registry.length;
    expect(finding.title).toContain(`원문 ${ko(raw.recordCount)}행`);
    expect(finding.title).toContain(raw.recordCount > kept ? `${ko(kept)}건이 등록부에 남았다` : "모두 등록부에 남았다");
    const sizes = catalogJson.categories.map((category) => category.registry.length).sort((a, b) => b - a);
    const rank = sizes.indexOf(kept) + 1;
    const phrase = rank === 1 ? "규모가 가장 큽니다" : rank === sizes.length ? "규모가 가장 작습니다" : `규모 ${rank}번째입니다`;
    expect(finding.body).toContain(phrase);
    expect(finding.body).toContain(`등록부 ${ko(sizes.reduce((sum, size) => sum + size, 0))}건`);
  });

  it.each(SLUGS)("%s: serving units and the majority threshold", (slug) => {
    const { raw, findings } = load(slug);
    const counts = new Map<string, number>();
    for (const record of raw.registry) {
      const unit = record.servingSize.replace(/[\d.\s]/g, "");
      counts.set(unit, (counts.get(unit) ?? 0) + 1);
    }
    const [[topLabel, topCount]] = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    const finding = findings.get("serving-unit")!;
    if (counts.size === 1) expect(finding.title).toBe(`${ko(topCount)}건 모두 ${topLabel} 단위`);
    else if (topCount * 2 >= raw.registry.length) expect(finding.title).toMatch(new RegExp(`^1회 섭취 단위는 ${topLabel}, .*로 가장 많다$`));
    else expect(finding.title).toContain(`가장 많은 단위(${topLabel})도`);
    if (counts.size === 1) {
      expect(finding.body).toContain(`${ko(topCount)}건이 전부 ${topLabel} 단위로`);
      const servings = new Map<string, number>();
      for (const record of raw.registry) servings.set(record.servingSize, (servings.get(record.servingSize) ?? 0) + 1);
      const [[commonLabel, commonCount]] = [...servings.entries()].sort((left, right) => right[1] - left[1]);
      expect(finding.body).toContain(`1회 ${commonLabel} 표기가 ${ko(commonCount)}건`);
    }
    else for (const [label, count] of counts) expect(finding.body).toContain(`${label} ${ko(count)}건`);
  });

  it.each(SLUGS)("%s: daily frequency split", (slug) => {
    const { raw, findings } = load(slug);
    const once = raw.registry.filter((record) => record.dailyFrequency === "1회").length;
    const twice = raw.registry.filter((record) => record.dailyFrequency === "2회").length;
    const more = raw.registry.filter((record) => /^[3-9]회$/.test(record.dailyFrequency)).length;
    const finding = findings.get("frequency")!;
    if (twice + more === 0) expect(finding.title).toBe(`${ko(once)}건 모두 하루 한 번`);
    else if (once * 2 >= once + twice + more) expect(finding.title).toMatch(new RegExp(`^${ko(once + twice + more)}건 중 .*는 하루 한 번, ${twice + more}건은 나눠 먹는다$`));
    else expect(finding.title).toMatch(new RegExp(`^${ko(once + twice + more)}건 중 하루 두 번 이상 나눠 먹는 제품이 `));
    expect(finding.body).toContain(`하루 1회 ${ko(once)}건, 2회 ${ko(twice)}건, 3회 이상 ${ko(more)}건`);
  });

  it.each(SLUGS)("%s: manufacturer concentration", (slug) => {
    const { raw, findings } = load(slug);
    const key = (name: string) => name.toUpperCase().replace(/주식회사|\(주\)|㈜/g, "").replace(/[\s\p{P}\p{S}]/gu, "");
    const counts = new Map<string, number>();
    for (const record of raw.registry) counts.set(key(record.manufacturer), (counts.get(key(record.manufacturer)) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const singles = [...counts.values()].filter((value) => value === 1).length;
    const finding = findings.get("manufacturer")!;
    expect(finding.title).toContain(top * 10 >= raw.registry.length ? `제조사 ${counts.size}곳 중 한 곳이` : `제조사 ${counts.size}곳 — 가장 많은 곳도 ${top}건`);
    expect(finding.body).toContain(`(${top}건)`);
    expect(finding.body).toContain(`등록 1건뿐인 곳이 ${singles}곳`);
  });

  it.each(SLUGS)("%s: amount distribution and the reference threshold", (slug) => {
    const { raw, findings } = load(slug);
    const unit = raw.activeUnit;
    if (!unit) {
      expect(findings.has("amount")).toBe(false);
      expect(findings.has("registry-reference")).toBe(false);
      return;
    }
    const values = raw.registry.map((record) => record.activeAmount).filter((value): value is number => value !== null && value > 0);
    const zeros = raw.registry.filter((record) => record.activeAmount === 0).length;
    const tally = new Map<number, number>();
    for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
    const [[mode]] = [...tally.entries()].sort((left, right) => right[1] - left[1] || left[0] - right[0]);
    const amount = findings.get("amount")!;
    expect(amount.title).toBe(`1일 함량 중앙값 ${amountLabel(medianOf(values), unit)}, 최빈값 ${amountLabel(mode, unit)}`);
    expect(amount.body).toContain(`${ko(values.length)}건 기준 최저 ${amountLabel(Math.min(...values), unit)}, 최고 ${amountLabel(Math.max(...values), unit)}`);
    expect(amount.body.includes(`0으로 적힌 ${zeros}건`)).toBe(zeros > 0);

    const reference = nutrientReferences.find((entry) => entry.id === slug)!;
    const atOrAbove = values.filter((value) => value >= reference.dailyTarget).length;
    const finding = findings.get("registry-reference")!;
    expect(finding.body).toContain(`기준치 이상은 ${ko(atOrAbove)}건`);
    if (atOrAbove * 2 >= values.length) expect(finding.title).toMatch(/가 1일 영양성분 기준치 .* 이상$/);
    else expect(finding.title).toBe(`1일 영양성분 기준치 ${amountLabel(reference.dailyTarget, unit)} 이상은 ${ko(atOrAbove)}건`);
  });
});

describe("category digest — verified-product facts match the price JSON", () => {
  it.each(SLUGS)("%s: order agreement between daily cost and unit price", (slug) => {
    const { products, byUnit, findings, basis } = load(slug);
    const finding = findings.get("verified-order")!;
    const amounts = new Set(products.map(({ product }) => product.dailyActiveAmount));
    // 1일 비용이 같으면 단위가격 순서를 유지한다(엔진의 안정 정렬과 같은 뜻)
    const byDaily = [...byUnit].sort((left, right) => left.daily - right.daily);
    const divergence = byDaily.findIndex((entry, index) => entry.product.id !== byUnit[index].product.id);
    if (amounts.size === 1) expect(finding.title).toMatch(/^검증 제품 \d+개 모두 1일 /);
    else if (divergence === -1) expect(finding.title).toMatch(/^1일 함량\(.+\)이 달라도 순서는 1일 비용과 같다$/);
    else if (divergence === 0) {
      expect(finding.title).toBe(`1일 비용 1위와 ${basis} 가격 1위가 다른 제품이다`);
      expect(finding.body).toContain(`1일 비용 1위(${byDaily[0].product.displayName},`);
    } else expect(finding.title).toBe(`1일 비용 순서와 ${basis} 가격 순서가 ${divergence + 1}위부터 갈린다`);
  });

  it.each(SLUGS)("%s: price spread threshold and ranges", (slug) => {
    const { products, byUnit, findings, basis } = load(slug);
    const finding = findings.get("price-spread")!;
    const ratio = byUnit[byUnit.length - 1].unit / byUnit[0].unit;
    const shown = Number(one(ratio).replaceAll(",", ""));
    expect(finding.title).toBe(shown >= 2 ? `${basis} 가격이 최대 ${one(ratio)}배 벌어진다` : `${basis} 가격 차이는 ${one(ratio)}배에 머문다`);
    const dailies = products.map(({ daily }) => daily);
    expect(finding.body).toContain(`1일 비용은 ${one(Math.min(...dailies))}원~${one(Math.max(...dailies))}원`);
    const sameAsDaily = products.every(({ unit, daily }) => unit === daily);
    expect(finding.body.includes("가격이 곧 1일 비용입니다")).toBe(sameAsDaily);
  });

  it.each(SLUGS)("%s: package length of the unit-price leader", (slug) => {
    const { byUnit, findings } = load(slug);
    const finding = findings.get("package")!;
    const days = byUnit.map(({ days: value }) => value);
    const top = byUnit[0].days;
    if (Math.min(...days) === Math.max(...days)) expect(finding.title).toContain("모두");
    else if (top === Math.max(...days)) expect(finding.title).toBe(`단위가격 1위가 가장 긴 ${ko(top)}일분 포장(${byUnit[0].product.packageLabel})`);
    else if (top === Math.min(...days)) expect(finding.title).toBe(`단위가격 1위는 가장 짧은 ${ko(top)}일분 포장(${byUnit[0].product.packageLabel})`);
    else expect(finding.title).toBe(`단위가격 1위는 ${ko(top)}일분, 포장은 ${ko(Math.min(...days))}~${ko(Math.max(...days))}일분`);
    expect(finding.body).toContain(byUnit[0].product.packageLabel);
  });

  it.each(SLUGS)("%s: mandatory shipping", (slug) => {
    const { products, findings } = load(slug);
    const finding = findings.get("shipping")!;
    const shipped = products.filter(({ product }) => product.offer.mandatoryShippingKrw > 0);
    if (shipped.length === 0) {
      const listed = products.map(({ product }) => product.offer.listedPriceKrw);
      expect(finding.title).toBe(`검증 제품 ${products.length}개 모두 필수 배송비 없이 판매가 ${ko(Math.min(...listed))}원~${ko(Math.max(...listed))}원`);
      return;
    }
    const share = ({ product }: (typeof products)[number]) =>
      product.offer.mandatoryShippingKrw / (product.offer.listedPriceKrw + product.offer.mandatoryShippingKrw);
    const largest = [...shipped].sort((left, right) => share(right) - share(left))[0];
    expect(finding.title).toBe(`필수 배송비가 붙는 제품 ${shipped.length}개 — 최대 총액의 ${Math.round(100 * share(largest))}%`);
    expect(finding.body).toContain(`배송비 비중이 가장 큰 제품(${largest.product.displayName})`);
  });

  it.each(SLUGS)("%s: verified amounts against the registry and the reference", (slug) => {
    const { raw, products, findings } = load(slug);
    const reference = nutrientReferences.find((entry) => entry.id === slug);
    const amounts = products.map(({ product }) => product.dailyActiveAmount);
    const versus = findings.get("verified-vs-registry");
    if (raw.activeUnit) {
      const registryMedian = medianOf(raw.registry.map((record) => record.activeAmount).filter((value): value is number => value !== null && value > 0));
      const mine = medianOf(amounts);
      const head = `검증 제품 함량 중앙값 ${amountLabel(mine, raw.activeUnit)}`;
      expect(versus!.title).toBe(mine > registryMedian
        ? `${head} — 등록부 ${amountLabel(registryMedian, raw.activeUnit)}보다 높다`
        : mine < registryMedian ? `${head} — 등록부 ${amountLabel(registryMedian, raw.activeUnit)}보다 낮다` : `${head} — 등록부와 같다`);
      const reportNos = new Set(raw.registry.map((record) => record.reportNo));
      expect(versus!.body).toContain(`같은 신고번호로 실린 제품은 ${products.filter(({ product }) => reportNos.has(product.reportNo)).length}개`);
    } else expect(versus).toBeUndefined();

    const verifiedReference = findings.get("verified-reference");
    if (!reference) {
      expect(verifiedReference).toBeUndefined();
      return;
    }
    const multiples = amounts.map((value) => value / reference.dailyTarget);
    const label = amountLabel(reference.dailyTarget, reference.canonicalUnit);
    if (multiples.every((value) => value >= 1)) expect(verifiedReference!.title).toBe(`검증 제품 ${amounts.length}개 모두 기준치 ${label} 이상`);
    else if (multiples.every((value) => value < 1)) expect(verifiedReference!.title).toBe(`검증 제품 ${amounts.length}개 모두 기준치 ${label}보다 적다`);
    else expect(verifiedReference!.title).toBe(`검증 제품 함량이 기준치 ${label} 위아래에 걸친다`);
  });

  it.each(SLUGS)("%s: ranking head, 100-point holder and registry caveat", (slug) => {
    const { raw, category, ranking, byUnit, basis } = load(slug);
    // "낮은 순서"라는 문장은 순위가 실제로 단위가격 오름차순일 때만 참이다
    const units = ranking.scores.map((score) => score.unitPriceKrw);
    expect(units).toEqual([...units].sort((a, b) => a - b));
    expect(rankingOrderSentence(ranking)).toBe(`${basis} 배송비 포함 가격이 낮은 순서입니다.`);
    const leaders = byUnit.filter(({ unit }) => unit === byUnit[0].unit).map(({ product }) => product.displayName);
    const sentence = topScoreSentence(ranking);
    expect(sentence).toContain(`가장 낮은 ${leaders.join("·")}에 붙습니다`);
    for (const { product } of byUnit.slice(leaders.length)) expect(sentence).not.toContain(product.displayName);
    expect(registryCaveatSentence(category)).toContain(`${raw.name} 등록 ${ko(raw.registry.length)}건`);
  });
});
