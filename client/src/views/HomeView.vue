<script setup lang="ts">
import { onMounted } from "vue";
import { ShSurface, ShText } from "@shakilabs/ui";
import SiteHeader from "@/components/SiteHeader.vue";
import HomeCategorySection from "@/components/category/HomeCategorySection.vue";
import ComparisonTray from "@/components/compare/ComparisonTray.vue";
import RankingCard from "@/components/ranking/RankingCard.vue";
import RankingFilters from "@/components/ranking/RankingFilters.vue";
import { useComparison } from "@/composables/useComparison";
import { useRanking } from "@/composables/useRanking";
import { trackAnalytics } from "@/utils/analytics";
import { formatScore, formatWon } from "@/utils/ranking";
import type { RankingFilterKey } from "@/utils/ranking";

const {
  allItems,
  brands,
  dataError,
  filterError,
  filters,
  resetFilters,
  updateFilter,
  visibleItems,
} = useRanking();

const topItem = allItems[0];
const {
  canCompare,
  clearSelection,
  compareLocation,
  isLimitReached,
  isSelected,
  selectedItems,
  selectionError,
  toggleProduct,
} = useComparison(allItems);

function handleFilterUpdate(key: RankingFilterKey, value: unknown): void {
  if (updateFilter(key, value)) {
    trackAnalytics({ name: "filter_apply", filter_name: key });
  }
}

onMounted(() => {
  trackAnalytics({
    name: "ranking_view",
    category: "multivitamin",
    score_version: "value-v1",
  });
});
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />

    <main>
      <section class="hero-field overflow-hidden border-b border-border/60">
        <div class="container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <div class="relative z-10 max-w-2xl">
            <p class="eyebrow">공공데이터 + 판매가 근거 · 2026.07.10</p>
            <ShText as="h1" variant="display" class="mt-4 break-keep">
              영양제 종류부터<br class="hidden lg:block" /> 비교 기준까지<br class="hidden lg:block" /> 나눴습니다.
            </ShText>
            <p class="mt-5 max-w-xl break-keep text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              5,556건의 식약처 제공 데이터에서 10개 제품군을 분리했습니다. 멀티비타민은 23개 영양소 가격효율로, 나머지 9개 종류는 핵심 성분 단위가격으로 비교합니다.
            </p>
            <div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span class="trust-chip">10개 영양제 종류</span>
              <span class="trust-chip">가격 확인일 공개</span>
              <span class="trust-chip">제휴 무관 동일 산식</span>
            </div>
            <a class="mt-7 inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:brightness-95" href="#categories">
              영양제 종류부터 보기
            </a>
          </div>

          <ShSurface v-if="topItem" as="aside" padding="lg" class="relative overflow-hidden" aria-label="현재 가격효율 1위">
            <div>
              <div class="flex items-center justify-between gap-3">
                <p class="eyebrow">현재 가격효율 1위</p>
                <span class="confidence-badge">신뢰도 {{ topItem.product.confidence }}</span>
              </div>
              <p class="mt-7 text-sm font-semibold text-primary">{{ topItem.product.brand }}</p>
              <h2 class="mt-1 break-keep font-brand text-2xl leading-snug">
                {{ topItem.product.officialName }}
              </h2>
              <div class="home-top-metrics mt-6 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background/80 py-4 text-center">
                <div class="px-2">
                  <p class="text-[11px] text-muted-foreground">하루</p>
                  <p class="mt-1 font-semibold tabular-nums">{{ formatWon(topItem.score.dailyCostKrw) }}</p>
                </div>
                <div class="px-2">
                  <p class="text-[11px] text-muted-foreground">충족도</p>
                  <p class="mt-1 font-semibold tabular-nums">{{ formatScore(topItem.score.coverageScore) }}%</p>
                </div>
                <div class="px-2">
                  <p class="text-[11px] text-muted-foreground">효율지수</p>
                  <p class="mt-1 font-semibold tabular-nums text-primary">{{ formatScore(topItem.score.valueIndex) }}</p>
                </div>
              </div>
              <p class="mt-4 text-xs leading-5 text-muted-foreground">
                1위는 일반 성인 기준 가격효율 산식 결과이며, 개인에게 가장 적합하다는 의료적 의미가 아닙니다.
              </p>
            </div>
          </ShSurface>
        </div>
      </section>

      <HomeCategorySection />

      <section id="ranking" class="container scroll-mt-4 py-10 sm:py-14" :class="selectedItems.length ? 'pb-36 sm:pb-44' : ''">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow">가격효율 순위</p>
            <ShText as="h2" variant="title" class="mt-2">가격당 영양효율 순위</ShText>
          </div>
          <p class="max-w-md break-keep text-xs leading-5 text-muted-foreground sm:text-right">
            기본 정렬은 영양충족도 ÷ 배송비 포함 1일 비용입니다. 가격은 실시간 최저가를 보장하지 않습니다.
          </p>
        </div>

        <RankingFilters
          :brands="brands"
          :filters="filters"
          :result-count="visibleItems.length"
          :total-count="allItems.length"
          @reset="resetFilters"
          @update="handleFilterUpdate"
        />

        <div v-if="dataError || filterError" class="mt-5 rounded-xl border border-status-danger/30 bg-card p-5 text-sm text-status-danger" role="alert">
          데이터를 표시할 수 없습니다. {{ dataError ?? filterError }}
        </div>

        <div v-else-if="visibleItems.length === 0" class="mt-5 rounded-xl border border-border bg-card px-5 py-12 text-center">
          <p class="font-semibold">조건에 맞는 제품이 없습니다.</p>
          <button class="touch-target mt-3 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-accent" type="button" @click="resetFilters">
            전체 제품 다시 보기
          </button>
        </div>

        <ol v-else class="ranking-list mt-5 space-y-3">
          <li v-for="item in visibleItems" :key="item.product.id">
            <RankingCard
              :compare-disabled="isLimitReached && !isSelected(item.product.id)"
              :item="item"
              :selected="isSelected(item.product.id)"
              @toggle-compare="toggleProduct"
            />
          </li>
        </ol>
      </section>

      <section id="method-note" class="border-y border-border/70 bg-muted/35">
        <div class="container grid gap-6 py-10 sm:grid-cols-3 sm:py-12">
          <div>
            <p class="method-number">01</p>
            <h2 class="mt-2 font-semibold">함량 과대평가 방지</h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">각 영양소 충족률은 100%까지만 점수에 반영합니다.</p>
          </div>
          <div>
            <p class="method-number">02</p>
            <h2 class="mt-2 font-semibold">배송비까지 일할 계산</h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">판매가와 필수 배송비를 총 복용일수로 나눕니다.</p>
          </div>
          <div>
            <p class="method-number">03</p>
            <h2 class="mt-2 font-semibold">공식 제품 식별 우선</h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">식약처 신고번호와 제조사를 확인한 제품만 공개합니다.</p>
          </div>
        </div>
      </section>
    </main>

    <ComparisonTray
      :can-compare="canCompare"
      :compare-location="compareLocation"
      :error="selectionError"
      :items="selectedItems"
      @clear="clearSelection"
      @remove="toggleProduct"
    />

  </div>
</template>
