import { catalogCategories, categoryCatalog, type CategoryCatalogEntry } from "./category-catalog";
import {
  amountFinding,
  frequencyFinding,
  manufacturerFinding,
  registryReferenceFinding,
  registrySizeFinding,
  servingUnitFinding,
  type DigestFinding,
} from "./category-digest-registry";
import { buildAmountStats, buildRegistryStats, referenceValueFor } from "./category-digest-stats";
import { buildVerifiedStats } from "./verified-digest-stats";
import {
  packageFinding,
  priceSpreadFinding,
  shippingFinding,
  verifiedOrderFinding,
  verifiedReferenceFinding,
  verifiedVsRegistryFinding,
} from "./category-digest-verified";
import { count, isoDot } from "./digest-format";
import type { UnitPriceRanking } from "./unit-price";

// 종류 페이지 "데이터에서 읽은 값" — finance·seller 파생 다이제스트의 nutri판.
// 규율: 효능·건강 주장 없음(YMYL), 숫자는 전부 등록부·순위 산출물·식약처 기준치에서 계산,
// 방향·경계 문장은 값에서 분기하고 category-digest.test.ts가 역방향까지 고정한다.

export type { DigestFinding } from "./category-digest-registry";

export interface DigestGroup {
  id: "verified" | "registry";
  label: string;
  findings: DigestFinding[];
}

export interface CategoryDigest {
  heading: string;
  intro: string;
  sourceNote: string;
  groups: DigestGroup[];
}

function present<T>(value: T | null | undefined | false): value is T {
  return Boolean(value);
}

export function buildCategoryDigest(
  category: CategoryCatalogEntry,
  ranking: UnitPriceRanking | null,
): CategoryDigest {
  const registry = buildRegistryStats(category);
  const amounts = buildAmountStats(category);
  const verified = buildVerifiedStats(ranking);
  const registryReference = amounts ? referenceValueFor(category.slug, category.activeUnit) : null;
  const verifiedReference = ranking && verified ? referenceValueFor(category.slug, ranking.category.activeUnit) : null;
  const registryReportNos = new Set(category.registry.map((record) => record.reportNo));
  const sameUnit = amounts && ranking && ranking.category.activeUnit === category.activeUnit
    && (category.activeUnit === "mg" || category.activeUnit === "ug") ? category.activeUnit : null;

  const verifiedFindings = ranking && verified
    ? [
      priceSpreadFinding(ranking, verified),
      verifiedOrderFinding(ranking, verified),
      packageFinding(ranking, verified),
      shippingFinding(ranking, verified),
      verifiedReference && verifiedReferenceFinding(ranking, verified, verifiedReference, !registryReference),
      amounts && sameUnit && verifiedVsRegistryFinding(
        ranking,
        verified,
        amounts,
        sameUnit,
        ranking.scores.filter((score) => registryReportNos.has(score.product.reportNo)).length,
      ),
    ].filter(present)
    : [];
  const registryFindings = [
    registrySizeFinding(category, registry, catalogCategories.length, categoryCatalog.source.dataReferenceDate),
    amounts && category.activeUnit && amountFinding(amounts, category.activeUnit),
    amounts && registryReference && registryReferenceFinding(amounts, registryReference),
    servingUnitFinding(registry),
    frequencyFinding(registry),
    manufacturerFinding(registry),
  ].filter(present);

  const groups: DigestGroup[] = [
    { id: "verified" as const, label: `검증 제품 ${count(verified?.count ?? 0)}개`, findings: verifiedFindings },
    { id: "registry" as const, label: `공식 등록부 ${count(registry.registryCount)}건`, findings: registryFindings },
  ].filter((group) => group.findings.length > 0);
  const total = groups.reduce((sum, group) => sum + group.findings.length, 0);
  const scope = verified
    ? `등록부 ${count(registry.registryCount)}건과 가격을 확인한 검증 제품 ${count(verified.count)}개`
    : `등록부 ${count(registry.registryCount)}건`;
  // 출처는 이 페이지가 실제로 읽은 범위(분류·행 수·제품 수)까지 적는다
  const sources = [
    `공공데이터 전국건강기능식품영양성분정보 ${isoDot(categoryCatalog.source.dataReferenceDate)} 스냅샷 ‘${category.datasetLabel}’ ${count(registry.rawRows)}행`,
    ranking && verified ? `검증 제품 ${count(verified.count)}개 가격 확인 ${isoDot(ranking.updatedAt)}` : null,
    registryReference || verifiedReference ? "식약처 1일 영양성분 기준치" : null,
  ].filter(present);
  return {
    heading: `${category.name} 데이터에서 읽은 ${total}가지`,
    intro: `${scope}에서 계산한 값이며, 효능·품질 판단은 담지 않습니다.`,
    sourceNote: `출처 ${sources.join(" · ")}`,
    groups,
  };
}

// 순위표 머리 문장: 어떤 기준으로 줄 세웠는지를 종류의 기준 단위로 말한다.
export function rankingOrderSentence(ranking: UnitPriceRanking): string {
  return `${ranking.category.basisLabel} 배송비 포함 가격이 낮은 순서입니다.`;
}

// 해석 주의 첫 문장: 100점이 지금 누구에게 붙었는지를 순위 산출물에서 그대로 읽는다(동점이면 모두).
export function topScoreSentence(ranking: UnitPriceRanking): string {
  const best = ranking.scores[0]?.unitPriceKrw;
  const leaders = ranking.scores.filter((score) => score.unitPriceKrw === best);
  if (leaders.length === 0) return "가격효율 100점은 현재 같은 카테고리 비교군에서 단위가격이 가장 낮다는 뜻입니다.";
  return `가격효율 100점은 지금 ${ranking.category.name} 비교군 ${count(ranking.scores.length)}개 가운데`
    + ` ${ranking.category.basisLabel} 가격이 가장 낮은 ${leaders.map((score) => score.product.displayName).join("·")}에 붙습니다.`;
}

// 등록부 표 머리 문장: 목록의 한계를 종류·건수와 함께 밝힌다.
export function registryCaveatSentence(category: CategoryCatalogEntry): string {
  return `${category.name} 등록 ${count(category.registry.length)}건에는 수입·신고 변형이 섞여 있을 수 있고, 판매 중 여부·가격은 이 목록과 별개입니다.`;
}
