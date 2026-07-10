import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { seoProducts } from "@/data/seo-products";
import { buildRankingItems, formatScore, formatWon } from "./ranking";

describe("lightweight SEO product index", () => {
  it("matches the current value-v1 ranking", () => {
    const ranking = buildRankingItems(nutriDataset);
    if (!ranking.success) throw new Error(ranking.detail);
    expect(seoProducts).toEqual(ranking.items.map((item) => ({
      slug: item.product.slug,
      name: item.product.officialName,
      rank: item.overallRank,
      dailyCostLabel: formatWon(item.score.dailyCostKrw),
      coverageLabel: `${formatScore(item.score.coverageScore)}%`,
    })));
  });
});
