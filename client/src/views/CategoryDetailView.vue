<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "@/components/SiteHeader.vue";
import UnitPriceComparison from "@/components/category/UnitPriceComparison.vue";
import { publicDataSnapshot } from "@/data/public-snapshot";
import { buildRegistryRanks, categoryCards, findCategory, formatActiveAmount } from "@/utils/category-catalog";
import { isRankingEligible, resolveUnitPriceRanking } from "@/utils/unit-price";
import { trackAnalytics } from "@/utils/analytics";

const route = useRoute();
const category = computed(() => findCategory(route.params.slug));
const unitPriceRanking = computed(() => resolveUnitPriceRanking(route.params.slug));
const ranked = computed(() => unitPriceRanking.value !== null && isRankingEligible(unitPriceRanking.value));
const registryRows = computed(() => {
  if (!category.value) return [];
  const ranks = buildRegistryRanks(category.value.registry);
  return category.value.registry.map((record, index) => ({ record, rank: ranks[index] }));
});
// Second-click module: rankings for every other category, so the page never dead-ends.
const otherCategoryCards = computed(() =>
  categoryCards.filter((card) => card.slug !== category.value?.slug));

function trackQuicklink(toSlug: string): void {
  trackAnalytics({
    name: "related_tool_click",
    from_tool: category.value?.slug ?? "category",
    to_tool: toSlug,
    placement: "category_quicklinks",
  });
}
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main v-if="category">
      <section class="hero-field border-b border-border/60">
        <div class="container py-9 sm:py-12">
          <a class="touch-target inline-flex items-center text-sm font-semibold text-primary" href="/nutri/categories">← 전체 영양제 종류</a>
          <div class="mt-6 grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{{ ranked ? "가격효율 순위" : unitPriceRanking ? "가격효율 비교" : "공식 목록" }}</span>
                <span class="rounded-full border border-status-warning/30 px-2.5 py-1 text-[10px] font-semibold text-status-warning">{{ unitPriceRanking ? "동일 성분 내 정량 비교 · 효능 순위 아님" : "순위가 아닙니다" }}</span>
              </div>
              <h1 class="mt-4 break-keep font-brand text-[2.15rem] leading-tight tracking-[-0.035em] sm:text-5xl">{{ category.name }} 영양제<br />{{ ranked ? `가격효율 순위 TOP ${unitPriceRanking!.scores.length}` : unitPriceRanking ? "가격효율·단위가격 비교" : "공식 등록 제품 찾기" }}</h1>
              <p class="mt-5 max-w-2xl break-keep text-base leading-7 text-muted-foreground">{{ unitPriceRanking ? unitPriceRanking.category.summary : `${category.summary}을 보여줍니다. 아래 제품은 최근 생성일과 제조사 다양성을 기준으로 추린 예시입니다.` }}</p>
            </div>
            <dl class="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card py-4 text-center">
              <div class="px-3"><dt class="text-[11px] text-muted-foreground">{{ unitPriceRanking ? "검증 제품" : "공식 레코드" }}</dt><dd class="mt-1 font-brand text-2xl text-primary">{{ unitPriceRanking ? unitPriceRanking.scores.length : category.recordCount.toLocaleString("ko-KR") }}</dd></div>
              <div class="px-3"><dt class="text-[11px] text-muted-foreground">{{ unitPriceRanking ? "가격 기준일" : "표시 예시" }}</dt><dd class="mt-1 font-brand" :class="unitPriceRanking ? 'text-base' : 'text-2xl'">{{ unitPriceRanking ? unitPriceRanking.updatedAt.replaceAll("-", ".") : category.records.length }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <UnitPriceComparison v-if="unitPriceRanking" :ranking="unitPriceRanking" />

      <section class="container py-10 sm:py-14">
        <div class="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div class="min-w-0">
            <div class="mb-5">
              <p class="eyebrow">공식 등록 목록</p>
              <h2 class="mt-2 font-brand text-2xl">식약처 등록 전체 {{ category.registry.length.toLocaleString("ko-KR") }}건{{ category.activeUnit ? " · 1일 함량 순위" : "" }}</h2>
              <p class="mt-3 break-keep text-xs leading-5 text-muted-foreground">공공데이터 표준영양성분 스냅샷의 해당 카테고리 전체 목록입니다. 수입·신고 변형이 포함될 수 있으며 판매 중 여부·가격은 별개입니다. {{ category.activeUnit ? "함량이 높은 순 순위이며 동일 함량은 동일 순위입니다. 효능·품질 순위가 아닙니다." : "" }}</p>
            </div>
            <div class="overflow-x-auto rounded-xl border border-border bg-card">
              <table class="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr class="border-b border-border bg-muted/40 text-left text-[11px] font-semibold text-muted-foreground">
                    <th v-if="category.activeUnit" class="whitespace-nowrap px-3 py-2.5" scope="col">순위</th>
                    <th class="px-3 py-2.5" scope="col">제품명</th>
                    <th class="px-3 py-2.5" scope="col">제조사</th>
                    <th class="whitespace-nowrap px-3 py-2.5" scope="col">1회 섭취</th>
                    <th v-if="category.activeUnit" class="whitespace-nowrap px-3 py-2.5 text-right" scope="col">1일 함량</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="{ record, rank } in registryRows"
                    :key="record.reportNo"
                    class="border-b border-border/60 last:border-b-0"
                    data-official-record
                  >
                    <td v-if="category.activeUnit" class="whitespace-nowrap px-3 py-2.5 text-xs font-semibold tabular-nums" :class="rank !== null && rank <= 3 ? 'text-primary' : 'text-muted-foreground'">
                      {{ rank !== null ? `${rank}위` : "—" }}
                    </td>
                    <td class="break-keep px-3 py-2.5">{{ record.name }}<span class="mt-0.5 block text-[11px] text-muted-foreground">신고번호 {{ record.reportNo }}</span></td>
                    <td class="break-keep px-3 py-2.5 text-xs text-muted-foreground">{{ record.manufacturer }}</td>
                    <td class="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{{ record.servingSize }} × {{ record.dailyFrequency }}</td>
                    <td v-if="category.activeUnit" class="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                      {{ record.activeAmount !== null ? formatActiveAmount(record.activeAmount, category.activeUnit) : "미기재" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside class="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-5">
            <p class="eyebrow">{{ unitPriceRanking ? "Comparison scope" : "Ranking readiness" }}</p>
            <h2 class="mt-2 break-keep font-semibold">{{ unitPriceRanking ? "현재 비교 범위" : "향후 비교 기준" }}</h2>
            <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ category.comparisonBasis }}</p>
            <h3 class="mt-6 text-xs font-semibold">{{ unitPriceRanking ? "반영하지 않는 요소" : "추가로 필요한 근거" }}</h3>
            <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
              <li v-for="evidence in unitPriceRanking ? ['원료 형태와 흡수율', '핵심 성분 외 기타 영양소', '개인별 적정 섭취량'] : category.nextEvidence" :key="evidence" class="flex gap-2"><span class="text-primary" aria-hidden="true">•</span><span>{{ evidence }}</span></li>
            </ul>
            <a class="touch-target mt-6 inline-flex items-center text-sm font-semibold text-primary" :href="publicDataSnapshot.sourceUrl" target="_blank" rel="noopener noreferrer">공공데이터 원문 확인 ↗</a>
          </aside>
        </div>
      </section>

      <section class="border-t border-border/60 bg-muted/20" aria-labelledby="category-quicklinks-title">
        <div class="container py-10 sm:py-12">
          <h2 id="category-quicklinks-title" class="font-brand text-2xl">다른 카테고리 가격효율 순위</h2>
          <p class="mt-2 text-xs leading-5 text-muted-foreground">모든 카테고리는 같은 산정 기준(배송비 포함 단위가격·공식 등록 검증)을 사용합니다.</p>
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <a
              v-for="card in otherCategoryCards"
              :key="card.slug"
              :href="card.href"
              class="touch-target group flex flex-col rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent"
              @click="trackQuicklink(card.slug)"
            >
              <span class="break-keep font-semibold group-hover:text-primary">{{ card.name }}</span>
              <span class="mt-1.5 text-[11px] text-muted-foreground">{{ card.countLabel }} {{ card.count.toLocaleString("ko-KR") }}</span>
            </a>
          </div>
        </div>
      </section>
    </main>
    <main v-else class="page-shell">
      <h1 class="font-brand text-3xl">카테고리를 찾을 수 없습니다</h1>
      <a class="touch-target mt-5 inline-flex items-center font-semibold text-primary" href="/nutri/categories">전체 종류로 돌아가기</a>
    </main>
  </div>
</template>
