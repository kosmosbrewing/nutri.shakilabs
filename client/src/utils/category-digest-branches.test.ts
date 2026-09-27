import { describe, expect, it } from "vitest";
import type { CategoryCatalogEntry, CategoryRegistryRecord } from "./category-catalog";
import {
  frequencyFinding,
  manufacturerFinding,
  registryReferenceFinding,
  registrySizeFinding,
  servingUnitFinding,
} from "./category-digest-registry";
import { buildAmountStats, buildRegistryStats, median, nearestRank } from "./category-digest-stats";
import { buildVerifiedStats } from "./verified-digest-stats";
import {
  packageFinding,
  priceSpreadFinding,
  shippingFinding,
  verifiedOrderFinding,
  verifiedReferenceFinding,
  verifiedVsRegistryFinding,
} from "./category-digest-verified";
import { percent } from "./digest-format";
import type { UnitPriceRanking } from "./unit-price";

// 합성 입력으로 모든 분기를 양방향으로 찌른다. 실데이터가 지금 한쪽 분기만 타더라도,
// 비교 부호를 뒤집거나 경계(=)를 빼면 여기서 반드시 red가 되어야 한다.

function category(records: Partial<CategoryRegistryRecord>[], recordCount = records.length): CategoryCatalogEntry {
  return {
    slug: "vitamin-d", name: "테스트", datasetLabel: "테스트 분류", summary: "요약", comparisonBasis: "기준",
    analysisState: "amount_in_snapshot", activeUnit: "ug", recordCount, nextEvidence: ["a", "b"], records: [],
    registry: records.map((record, index) => ({
      name: `제품${index}`, manufacturer: `MAKER${index}`, reportNo: `R${index}`,
      servingSize: "1캡슐", dailyFrequency: "1회", activeAmount: null, ...record,
    })),
  };
}

interface Row { id: string; amount: number; price: number; days: number; ship?: number }

function ranking(rows: Row[], basisAmount = 10): UnitPriceRanking {
  const scores = rows.map((row) => {
    const daily = (row.price + (row.ship ?? 0)) / row.days;
    return {
      product: {
        id: row.id, displayName: `상품${row.id}`, dailyActiveAmount: row.amount, reportNo: `R-${row.id}`,
        packageLabel: `${row.days}정 × 1병`, servingLabel: "1일 1정",
        offer: { listedPriceKrw: row.price, mandatoryShippingKrw: row.ship ?? 0 },
      },
      totalDays: row.days, dailyCostKrw: daily, monthlyCostKrw: daily * 30, unitPriceKrw: daily / (row.amount / basisAmount),
    };
  }).sort((left, right) => left.unitPriceKrw - right.unitPriceKrw).map((score, index) => ({ ...score, rank: index + 1 }));
  return {
    category: { slug: "vitamin-d", name: "테스트", activeName: "테스트", activeUnit: "ug", basisAmount, basisLabel: "테스트 10 μg당", summary: "", products: [] },
    scores, updatedAt: "2026-07-29", asOf: "2026-07-29", freshness: "fresh", ageDays: 0,
  } as unknown as UnitPriceRanking;
}

const verified = (rows: Row[]) => {
  const fake = ranking(rows);
  return { fake, stats: buildVerifiedStats(fake)! };
};

describe("registry lenses — every branch", () => {
  it("registry size: rows dropped vs none dropped", () => {
    const kept = category([{}, {}], 3);
    expect(registrySizeFinding(kept, buildRegistryStats(kept), 9, "2026-06-23").title).toBe("원문 3행 중 2건이 등록부에 남았다");
    const all = category([{}, {}]);
    expect(registrySizeFinding(all, buildRegistryStats(all), 9, "2026-06-23").title).toBe("원문 2행이 모두 등록부에 남았다");
  });

  it("serving unit: single, majority (boundary 50%), plurality, two units", () => {
    const single = servingUnitFinding(buildRegistryStats(category([{}, {}, { servingSize: "2캡슐" }])))!;
    expect(single.title).toBe("3건 모두 캡슐 단위");
    expect(single.body).toContain("1회 1캡슐 표기가 2건(67%)");
    const half = buildRegistryStats(category([{}, {}, { servingSize: "1정" }, { servingSize: "1포" }]));
    expect(servingUnitFinding(half)!.title).toBe("1회 섭취 단위는 캡슐, 50%로 가장 많다");
    const plural = buildRegistryStats(category([{}, {}, { servingSize: "1정" }, { servingSize: "1포" }, { servingSize: "1구미" }]));
    expect(servingUnitFinding(plural)!.title).toBe("가장 많은 단위(캡슐)도 40% — 섭취 단위가 4가지로 갈린다");
    const pair = buildRegistryStats(category([{}, {}, { servingSize: "2정" }]));
    expect(servingUnitFinding(pair)!.body).toBe("신고된 1회 섭취량 표기는 캡슐 2건, 정 1건, 두 단위뿐입니다.");
  });

  it("frequency: all once, once-majority (boundary 50%), split-majority, pill maximum", () => {
    expect(frequencyFinding(buildRegistryStats(category([{}, {}])))!.title).toBe("2건 모두 하루 한 번");
    const half = buildRegistryStats(category([{}, { dailyFrequency: "2회" }]));
    expect(frequencyFinding(half)!.title).toBe("2건 중 50%는 하루 한 번, 1건은 나눠 먹는다");
    const split = buildRegistryStats(category([{}, { dailyFrequency: "2회" }, { dailyFrequency: "3회", servingSize: "2정" }]));
    const finding = frequencyFinding(split)!;
    expect(finding.title).toBe("3건 중 하루 두 번 이상 나눠 먹는 제품이 67%");
    expect(finding.body).toContain("하루 6개(제품2, 2정 × 3회)");
  });

  it("manufacturer: concentration boundary at 10% and name merging", () => {
    const ten = Array.from({ length: 10 }, (_, index) => ({ manufacturer: index === 0 ? "ACME INC." : `OTHER${index}` }));
    expect(manufacturerFinding(buildRegistryStats(category(ten))).title).toBe("제조사 10곳 중 한 곳이 10%를 만든다");
    const eleven = Array.from({ length: 11 }, (_, index) => ({ manufacturer: `OTHER${index}` }));
    expect(manufacturerFinding(buildRegistryStats(category(eleven))).title).toBe("제조사 11곳 — 가장 많은 곳도 1건");
    const merged = buildRegistryStats(category([{ manufacturer: "ACME INC." }, { manufacturer: "ACMEINC." }, { manufacturer: "(주)에이" }, { manufacturer: "에이" }]));
    expect(merged.manufacturers).toMatchObject({ rawNames: 4, distinct: 2, singles: 0 });
  });

  it("amount stats: zeros excluded, even-length median, nearest-rank quartiles", () => {
    const stats = buildAmountStats(category([{ activeAmount: 0 }, { activeAmount: 10 }, { activeAmount: 20 }, { activeAmount: 30 }, { activeAmount: 40 }, { activeAmount: null }]))!;
    expect(stats).toMatchObject({ zeros: 1, missing: 1, min: 10, max: 40, median: 25, q1: 10, q3: 30 });
    expect(median([1, 3])).toBe(2);
    expect(median([1, 2, 9])).toBe(2);
    expect(nearestRank([1, 2, 3, 4], 0.75)).toBe(3);
  });

  it("registry reference: majority boundary counts values equal to the reference", () => {
    const at = buildAmountStats(category([{ activeAmount: 10 }, { activeAmount: 5 }]))!;
    expect(registryReferenceFinding(at, { amount: 10, unit: "ug" }).title).toBe("50%가 1일 영양성분 기준치 10 μg 이상");
    const below = buildAmountStats(category([{ activeAmount: 10 }, { activeAmount: 5 }, { activeAmount: 1 }]))!;
    expect(registryReferenceFinding(below, { amount: 10, unit: "ug" }).title).toBe("1일 영양성분 기준치 10 μg 이상은 1건");
  });
});

describe("verified lenses — every branch", () => {
  it("order: same amount, different amount but same order, diverging at 1st and at kth", () => {
    const same = verified([{ id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 10, price: 300, days: 10 }]);
    expect(verifiedOrderFinding(same.fake, same.stats).title).toBe("검증 제품 2개 모두 1일 10 μg");
    const agree = verified([{ id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 20, price: 300, days: 10 }]);
    expect(verifiedOrderFinding(agree.fake, agree.stats).title).toBe("1일 함량(10 μg~20 μg)이 달라도 순서는 1일 비용과 같다");
    const first = verified([{ id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 40, price: 200, days: 10 }]);
    const flipped = verifiedOrderFinding(first.fake, first.stats);
    expect(flipped.title).toBe("1일 비용 1위와 테스트 10 μg당 가격 1위가 다른 제품이다");
    expect(flipped.body).toContain("1일 비용 1위(상품a, 10원)");
    expect(flipped.body).toContain("테스트 10 μg당 가격 1위는 상품b");
    // 단위가격 순서 a·b·d·c, 1일 비용 순서 a·b·c·d → 3위에서 처음 갈린다
    const third = verified([
      { id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 10, price: 200, days: 10 },
      { id: "c", amount: 10, price: 500, days: 10 }, { id: "d", amount: 20, price: 600, days: 10 },
    ]);
    expect(verifiedOrderFinding(third.fake, third.stats).title).toBe("1일 비용 순서와 테스트 10 μg당 가격 순서가 3위부터 갈린다");
  });

  it("price spread: threshold at a displayed 2x", () => {
    const spread = (price: number) => {
      const { fake, stats } = verified([{ id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 10, price, days: 10 }]);
      return priceSpreadFinding(fake, stats).title;
    };
    expect(spread(200)).toBe("테스트 10 μg당 가격이 최대 2배 벌어진다");
    // 1.96배는 화면에 2배로 찍히므로 "머문다"가 되면 안 된다
    expect(spread(196)).toBe("테스트 10 μg당 가격이 최대 2배 벌어진다");
    expect(spread(194)).toBe("테스트 10 μg당 가격 차이는 1.9배에 머문다");
  });

  it("package: equal, leader longest, leader shortest, leader in between", () => {
    const equal = verified([{ id: "a", amount: 10, price: 100, days: 30 }, { id: "b", amount: 10, price: 200, days: 30 }]);
    expect(packageFinding(equal.fake, equal.stats).title).toBe("검증 제품 2개 모두 30일분 포장");
    const longest = verified([{ id: "a", amount: 10, price: 100, days: 90 }, { id: "b", amount: 10, price: 100, days: 30 }]);
    expect(packageFinding(longest.fake, longest.stats).title).toBe("단위가격 1위가 가장 긴 90일분 포장(90정 × 1병)");
    const shortest = verified([{ id: "a", amount: 10, price: 10, days: 30 }, { id: "b", amount: 10, price: 900, days: 90 }]);
    expect(packageFinding(shortest.fake, shortest.stats).title).toBe("단위가격 1위는 가장 짧은 30일분 포장(30정 × 1병)");
    const middle = verified([
      { id: "a", amount: 10, price: 60, days: 60 }, { id: "b", amount: 10, price: 900, days: 90 }, { id: "c", amount: 10, price: 900, days: 30 },
    ]);
    expect(packageFinding(middle.fake, middle.stats).title).toBe("단위가격 1위는 60일분, 포장은 30~90일분");
  });

  it("shipping: none, and the largest share wins", () => {
    const none = verified([{ id: "a", amount: 10, price: 100, days: 10 }, { id: "b", amount: 10, price: 200, days: 10 }]);
    expect(shippingFinding(none.fake, none.stats).title).toBe("검증 제품 2개 모두 필수 배송비 없이 판매가 100원~200원");
    const some = verified([
      { id: "a", amount: 10, price: 900, ship: 100, days: 10 }, { id: "b", amount: 10, price: 100, ship: 100, days: 10 },
      { id: "c", amount: 10, price: 3_000, days: 10 },
    ]);
    const finding = shippingFinding(some.fake, some.stats);
    expect(finding.title).toBe("필수 배송비가 붙는 제품 2개 — 최대 총액의 50%");
    expect(finding.body).toContain("배송비 비중이 가장 큰 제품(상품b)은 배송비 100원이 총액의 50%");
  });

  it("verified vs registry median: higher, lower, equal", () => {
    const registry = buildAmountStats(category([{ activeAmount: 10 }, { activeAmount: 20 }, { activeAmount: 30 }]))!;
    const title = (amount: number) => {
      const { fake, stats } = verified([{ id: "a", amount, price: 100, days: 10 }]);
      return verifiedVsRegistryFinding(fake, stats, registry, "ug", 0).title;
    };
    expect(title(30)).toBe("검증 제품 함량 중앙값 30 μg — 등록부 20 μg보다 높다");
    expect(title(10)).toBe("검증 제품 함량 중앙값 10 μg — 등록부 20 μg보다 낮다");
    expect(title(20)).toBe("검증 제품 함량 중앙값 20 μg — 등록부와 같다");
  });

  it("verified reference: all at-or-above (boundary), all below, mixed", () => {
    const title = (amounts: number[]) => {
      const { fake, stats } = verified(amounts.map((amount, index) => ({ id: `p${index}`, amount, price: 100 + index, days: 10 })));
      return verifiedReferenceFinding(fake, stats, { amount: 10, unit: "ug" }, true).title;
    };
    expect(title([10, 20])).toBe("검증 제품 2개 모두 기준치 10 μg 이상");
    expect(title([5, 9])).toBe("검증 제품 2개 모두 기준치 10 μg보다 적다");
    expect(title([5, 20])).toBe("검증 제품 함량이 기준치 10 μg 위아래에 걸친다");
  });
});

describe("digest number format", () => {
  it("never rounds a partial share to 0% or 100%", () => {
    expect(percent(1, 176)).toBe("1%");
    expect(percent(1, 300)).toBe("0.3%");
    expect(percent(299, 300)).toBe("99.7%");
    expect(percent(0, 5)).toBe("0%");
    expect(percent(5, 5)).toBe("100%");
    expect(() => percent(1, 0)).toThrow();
  });
});
