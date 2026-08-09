import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { buildRankingItems } from "./ranking";
import { buildProductNarrative } from "./product-narrative";

const result = buildRankingItems(nutriDataset);
if (!result.success) throw new Error(result.detail);
const items = result.items;

describe("buildProductNarrative", () => {
  it("derives every product narrative from the ranking output", () => {
    for (const item of items) {
      const narrative = buildProductNarrative(item, items);
      expect(narrative.paragraphs.length).toBeGreaterThanOrEqual(4);
      expect(narrative.facts.length).toBeGreaterThanOrEqual(4);
      // 점수·비용은 반드시 산출물 값과 같은 문자열로 찍혀야 한다.
      expect(narrative.paragraphs[0]).toContain(item.score.valueIndex.toFixed(1));
      expect(narrative.paragraphs[1]).toContain(`${Math.round(item.score.dailyCostKrw).toLocaleString("ko-KR")}원`);
      expect(narrative.paragraphs[2]).toContain(item.score.coverageScore.toFixed(1));
    }
  });

  it("keeps the non-efficacy disclaimer on every product", () => {
    for (const item of items) {
      expect(buildProductNarrative(item, items).disclaimer).toContain("순위가 아닙니다");
    }
  });

  it("gives each product a distinct body so pages do not read alike", () => {
    const bodies = items.map((item) => {
      const narrative = buildProductNarrative(item, items);
      return [...narrative.paragraphs, ...narrative.facts.map((fact) => `${fact.label}${fact.value}`)].join(" ");
    });
    expect(new Set(bodies).size).toBe(items.length);

    // 최악 쌍이라도 4-gram 코사인 유사도가 0.85 미만이어야 한다.
    const grams = bodies.map((body) => {
      const compact = body.replace(/\s+/g, "");
      const counts = new Map<string, number>();
      for (let index = 0; index + 4 <= compact.length; index += 1) {
        const gram = compact.slice(index, index + 4);
        counts.set(gram, (counts.get(gram) ?? 0) + 1);
      }
      return counts;
    });
    const cosine = (left: Map<string, number>, right: Map<string, number>): number => {
      let dot = 0;
      let leftNorm = 0;
      let rightNorm = 0;
      for (const value of left.values()) leftNorm += value * value;
      for (const value of right.values()) rightNorm += value * value;
      for (const [gram, value] of left) dot += value * (right.get(gram) ?? 0);
      return dot / Math.sqrt(leftNorm * rightNorm);
    };
    let worst = 0;
    for (let i = 0; i < grams.length; i += 1) {
      for (let j = i + 1; j < grams.length; j += 1) worst = Math.max(worst, cosine(grams[i], grams[j]));
    }
    expect(worst).toBeLessThan(0.85);
  });

  it("only reports alternatives that beat the product on both axes", () => {
    const worst = items[items.length - 1];
    const narrative = buildProductNarrative(worst, items);
    const dominance = narrative.paragraphs.find((paragraph) => paragraph.includes("영양충족도까지 높은 제품"));
    expect(dominance).toBeDefined();
    const better = items.filter((entry) =>
      entry.product.id !== worst.product.id
      && entry.score.dailyCostKrw < worst.score.dailyCostKrw
      && entry.score.coverageScore > worst.score.coverageScore);
    expect(dominance).toContain(`${better.length}개`);
  });
});
