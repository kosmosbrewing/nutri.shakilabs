import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { nutrientReferences } from "@/data/nutrients";
import { buildProductContrast } from "./product-contrast";
import { buildRankingItems, type RankingItem } from "./ranking";

// 기대값은 value-v1 산출물(coverage)의 원값에서 이 파일이 따로 센다 — product-contrast.ts의
// 헬퍼를 다시 부르면 판정 규칙이 틀려도 같이 틀려 초록불이 켜진다.

const result = buildRankingItems(nutriDataset);
if (!result.success) throw new Error(result.detail);
const items = result.items;
const names = new Map(nutrientReferences.map((reference) => [reference.id, reference.name]));
const cases = items.map((item) => [item.product.slug, item] as const);

function amountOf(item: RankingItem, nutrientId: string): number {
  return item.score.coverage.find((entry) => entry.nutrientId === nutrientId)!.dailyAmount;
}

describe("product contrast — reference verdict", () => {
  it.each(cases)("%s: met / below / unlisted counts and below order", (_slug, item) => {
    const met = item.score.coverage.filter((entry) => entry.dailyAmount >= entry.target).length;
    const unlisted = item.score.coverage.filter((entry) => entry.dailyAmount === 0).length;
    const below = item.score.coverage
      .filter((entry) => entry.dailyAmount > 0 && entry.dailyAmount < entry.target)
      .sort((left, right) => left.dailyAmount / left.target - right.dailyAmount / right.target);
    const { verdict } = buildProductContrast(item, items);
    expect(verdict.title).toBe(`기준치 충족 ${met}개 · 미달 ${below.length}개 · 미표시 ${unlisted}개`);
    expect(verdict.body).toContain(`기준치를 채운 항목은 ${met}개입니다.`);
    expect(verdict.body.includes("충족률이 낮은 순서로")).toBe(below.length > 1);
    expect(verdict.body.includes("하나입니다")).toBe(below.length === 1);
    expect(verdict.body.includes(`전체 라벨에 표시가 없는 ${unlisted}개`)).toBe(unlisted > 0);
    // "충족률이 낮은 순서로" — 목록 순서가 실제 충족률 오름차순이어야 참이다
    const positions = below.map((entry) => verdict.body.indexOf(`${names.get(entry.nutrientId)} `));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });
});

describe("product contrast — closest product", () => {
  it.each(cases)("%s: partner shares the most identical amounts, differences listed largest first", (_slug, item) => {
    const same = (other: RankingItem) => item.score.coverage
      .filter((entry) => entry.dailyAmount === amountOf(other, entry.nutrientId)).length;
    const others = items.filter((other) => other.product.id !== item.product.id);
    const best = Math.max(...others.map(same));
    const { closest } = buildProductContrast(item, items);
    expect(closest).not.toBeNull();
    expect(same(closest!.partner)).toBe(best);
    const total = item.score.coverage.length;
    expect(closest!.body).toContain(best > 0 ? `(${total}개 중 ${best}개 같음)` : "하나도 같지 않습니다");

    const differing = item.score.coverage
      .filter((entry) => entry.dailyAmount !== amountOf(closest!.partner, entry.nutrientId))
      .map((entry) => {
        const theirs = amountOf(closest!.partner, entry.nutrientId);
        const magnitude = entry.dailyAmount > 0 && theirs > 0
          ? Math.abs(Math.log(entry.dailyAmount / theirs))
          : Number.POSITIVE_INFINITY;
        return { name: names.get(entry.nutrientId)!, magnitude };
      })
      .sort((left, right) => right.magnitude - left.magnitude);
    expect(closest!.title).toContain(`${differing.length}개 영양소`);
    // "차이가 큰 순서로" — 앞의 다섯 개가 그 순서대로 적혀야 한다
    const listed = differing.slice(0, 5).map(({ name }) => closest!.body.indexOf(`${name} `));
    expect(listed.every((position) => position >= 0)).toBe(true);
    expect(listed).toEqual([...listed].sort((left, right) => left - right));
  });

  it("gives the audit's near-duplicate pairs different leading content", () => {
    const pairs = [["centrum-men-50", "centrum-women-112"], ["centrum-silver-men-112", "centrum-silver-women-50"]];
    for (const [left, right] of pairs) {
      const a = buildProductContrast(items.find((item) => item.product.slug === left)!, items);
      const b = buildProductContrast(items.find((item) => item.product.slug === right)!, items);
      expect(a.verdict.body).not.toBe(b.verdict.body);
      expect(a.closest!.body).not.toBe(b.closest!.body);
    }
  });
});
