import { describe, expect, it } from "vitest";
import catalogJson from "@/data/category-catalog.json";
import unitPriceJson from "@/data/unit-price-products.json";
import { catalogCategories } from "./category-catalog";
import { buildCategoryDigest, rankingOrderSentence, registryCaveatSentence, topScoreSentence } from "./category-digest";
import { resolveUnitPriceRanking } from "./unit-price";

// 다이제스트 품질 가드: 발견 밀도, 종류 간 문장 중복 0, 효능·복용 표현 금지, 단위 뒤 조사.
// 외부 점검(09-27)이 잰 "다른 종류 페이지 3곳 이상과 같은 15자 이상 문장"을 새 문장에는 아예 허용하지 않는다.

function load(slug: string) {
  const category = catalogCategories.find((entry) => entry.slug === slug)!;
  const ranking = resolveUnitPriceRanking(slug)!;
  return { raw: catalogJson.categories.find((entry) => entry.slug === slug)!, category, ranking, digest: buildCategoryDigest(category, ranking) };
}

describe("category digest — density, uniqueness and YMYL guard", () => {
  const pages = catalogJson.categories.map(({ slug }) => load(slug));
  const texts = (page: ReturnType<typeof load>) => [
    page.digest.heading, page.digest.intro, page.digest.sourceNote,
    ...page.digest.groups.flatMap((group) => group.findings.flatMap((finding) => [finding.title, finding.body])),
    rankingOrderSentence(page.ranking), topScoreSentence(page.ranking), registryCaveatSentence(page.category),
  ];

  it("every category page carries at least 8 derived findings, each with numbers", () => {
    for (const page of pages) {
      const findings = page.digest.groups.flatMap((group) => group.findings);
      expect(findings.length, page.raw.slug).toBeGreaterThanOrEqual(8);
      expect(page.digest.heading).toBe(`${page.raw.name} 데이터에서 읽은 ${findings.length}가지`);
      for (const finding of findings) {
        expect((finding.body.match(/\d[\d,.]*/g) ?? []).length, `${page.raw.slug}#${finding.id}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("no sentence of 15+ characters repeats on another category page", () => {
    const owner = new Map<string, string>();
    for (const page of pages) {
      for (const sentence of texts(page).flatMap((text) => text.split(/(?<=[.!?])\s+/))) {
        if (sentence.length < 15) continue;
        expect(owner.get(sentence) ?? page.raw.slug, sentence).toBe(page.raw.slug);
        owner.set(sentence, page.raw.slug);
      }
    }
  });

  it("makes no efficacy or dosage claims and keeps unit particles right", () => {
    // 데이터에서 온 이름(제품·제조사)은 걸러 내고 우리가 쓴 문장 틀만 검사한다
    const names = [
      ...unitPriceJson.categories.flatMap((entry) => entry.products.map((product) => product.displayName)),
      ...catalogJson.categories.flatMap((entry) => entry.registry.flatMap((record) => [record.name, record.manufacturer])),
    ].sort((left, right) => right.length - left.length);
    for (const page of pages) {
      for (const text of texts(page)) {
        const template = names.reduce((current, name) => current.replaceAll(name, "□"), text);
        expect(template).not.toMatch(/효과|효능이|예방|치료|완치|개선|도움|추천|좋은|좋습니다|권장합니다|드세요|섭취하세요/);
        expect(template).not.toMatch(/(μg|mg|CFU)(로|는|가|를|와|라)(\s|$|[,.])/);
        expect(template).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });
});
