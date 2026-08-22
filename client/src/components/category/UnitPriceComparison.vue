<script setup lang="ts">
import { computed } from "vue";
import PriceFreshnessBadge from "@/components/common/PriceFreshnessBadge.vue";
import PriceFreshnessNotice from "@/components/common/PriceFreshnessNotice.vue";
import { usePriceFreshness } from "@/composables/usePriceFreshness";
import { worstFreshness } from "@/utils/scoring";
import type { UnitPriceRanking, UnitPriceScore } from "@/utils/unit-price";
import { formatPriceEfficiency, formatUnitPriceAmount, formatUnitPriceWon, isRankingEligible } from "@/utils/unit-price";

const props = defineProps<{ ranking: UnitPriceRanking }>();
const ranked = computed(() => isRankingEligible(props.ranking));

const { resolve } = usePriceFreshness();

function freshnessOf(score: UnitPriceScore) {
  return resolve(score.product.offer.capturedAt);
}

const sectionFreshness = computed(() => worstFreshness(props.ranking.scores.map(freshnessOf)));

function totalDaysLabel(score: UnitPriceScore): string {
  return `총 ${score.totalDays.toLocaleString("ko-KR")}일분`;
}
</script>

<template>
  <!-- The ranking's own clock is published here so the build gate can catch a regression
       where the badge is right but the ranking still measures against a stale date. -->
  <section
    class="border-b border-border/60 bg-accent/25"
    :data-unit-price-section="ranking.category.slug"
    :data-price-ranking-freshness="ranking.freshness"
    :data-price-ranking-age-days="ranking.ageDays"
  >
    <div class="container py-10 sm:py-14">
      <!-- 멀티비타민 랭킹 섹션과 동일한 헤더 문법: 좌측 타이틀 블록 + 우측 기준 요약 -->
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">{{ ranked ? "종류별 가격효율 순위" : "종류별 가격 비교" }}</p>
          <h2 class="mt-2 break-keep font-brand text-3xl sm:text-4xl">
            {{ ranking.category.name }} {{ ranked ? `가격효율 순위 TOP ${ranking.scores.length}` : "가격효율 비교" }}
          </h2>
          <p class="mt-4 max-w-3xl break-keep text-sm leading-6 text-muted-foreground sm:text-base">
            {{ ranked
              ? "배송비 포함 단위가격이 낮은 순서입니다. 효능·품질 순위가 아닙니다."
              : `${ranking.category.summary}입니다. 배송비와 세트 수량을 포함하며 같은 카테고리 안에서만 비교합니다.` }}
          </p>
        </div>
        <p class="max-w-md break-keep text-xs leading-5 text-muted-foreground sm:text-right">
          비교 기준 {{ ranking.category.basisLabel }} · 최고 효율 100점 · unit-price-v1 ·
          가격 확인 {{ ranking.updatedAt.replaceAll("-", ".") }}
        </p>
      </div>

      <PriceFreshnessNotice
        class="mb-5"
        :freshness="sectionFreshness.freshness"
        :age-days="sectionFreshness.ageDays"
      />

      <!-- 멀티비타민 RankingCard와 동일한 행 리스트 문법 -->
      <ol class="ranking-list mt-5 space-y-3">
        <li v-for="score in ranking.scores" :key="score.product.id">
          <article
            class="ranking-card"
            :class="score.rank === 1 ? 'ranking-card--top' : ''"
            :data-unit-price-card="score.product.id"
            :data-price-efficiency-score="score.priceEfficiencyIndex.toFixed(1)"
          >
            <div class="grid min-w-0 gap-4 p-4 sm:p-5 min-[900px]:grid-cols-[4rem_minmax(0,1.5fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_7.5rem] min-[900px]:items-center">
              <div class="flex items-center justify-between min-[900px]:block">
                <div
                  class="grid h-12 w-12 shrink-0 place-items-center rounded-full font-brand text-lg"
                  :class="score.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'"
                  :aria-label="`${ranking.category.name} 가격효율 ${score.rank}위`"
                >
                  {{ score.rank }}
                </div>
                <span class="confidence-badge min-[900px]:mt-2">신뢰도 {{ score.product.confidence }}</span>
              </div>

              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="brand-mark" aria-hidden="true">{{ score.product.brand.slice(0, 1) }}</span>
                  <p class="truncate text-xs font-semibold text-primary">{{ score.product.brand }}</p>
                </div>
                <h3 class="mt-2 break-keep text-lg font-semibold leading-snug sm:text-xl">
                  {{ score.product.displayName }}
                </h3>
                <!-- report number lives in the bottom strip only to reduce body density -->
                <p class="mt-2 text-xs leading-5 text-muted-foreground">
                  {{ score.product.servingLabel }} · {{ score.product.packageLabel }} · {{ totalDaysLabel(score) }}
                </p>
              </div>

              <div class="metric-block">
                <p class="metric-label">배송비 포함 1일</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {{ formatUnitPriceWon(score.dailyCostKrw) }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">월 {{ formatUnitPriceWon(score.monthlyCostKrw) }}</p>
              </div>

              <div class="metric-block">
                <p class="metric-label">{{ ranking.category.basisLabel }}</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {{ formatUnitPriceWon(score.unitPriceKrw) }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  1일 {{ formatUnitPriceAmount(score.product.dailyActiveAmount, score.product.activeUnit) }}
                </p>
              </div>

              <div class="flex items-end justify-between gap-4 min-[900px]:block min-[900px]:text-right">
                <div>
                  <p class="metric-label">가격효율지수</p>
                  <p class="mt-1 font-brand text-2xl text-primary">{{ formatPriceEfficiency(score.priceEfficiencyIndex) }}</p>
                </div>
                <div class="flex flex-wrap justify-end gap-1.5 min-[900px]:mt-2">
                  <a
                    class="touch-target inline-flex items-center rounded-lg border border-border px-2.5 text-xs font-semibold hover:border-primary hover:text-primary"
                    :href="score.product.offer.url"
                    rel="noopener noreferrer"
                    target="_blank"
                    data-unit-price-source="price"
                  >가격 원문</a>
                  <a
                    class="touch-target inline-flex items-center rounded-lg border border-border px-2.5 text-xs font-semibold hover:border-primary hover:text-primary"
                    :href="score.product.officialSourceUrl"
                    rel="noopener noreferrer"
                    target="_blank"
                    data-unit-price-source="official"
                  >공식 근거</a>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/25 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
              <span class="flex flex-wrap items-center gap-2">
                <PriceFreshnessBadge
                  :freshness="freshnessOf(score).freshness"
                  :age-days="freshnessOf(score).ageDays"
                />
                <span>가격 확인 {{ score.product.offer.capturedAt.replaceAll("-", ".") }} · {{ score.product.offer.seller }} · 비제휴 링크</span>
              </span>
              <span>신고번호 {{ score.product.reportNo }}</span>
            </div>
          </article>
        </li>
      </ol>

      <div class="mt-5 rounded-xl border border-status-warning/30 bg-card px-5 py-4 text-sm leading-6">
        <strong class="font-semibold">해석 주의</strong>
        <span class="ml-2 break-keep text-muted-foreground">가격효율 100점은 현재 같은 카테고리 비교군에서 단위가격이 가장 낮다는 뜻입니다. 낮은 단위가격은 구매 판단의 한 요소일 뿐이며 복용 권장이나 개인 적합성을 뜻하지 않습니다.</span>
      </div>
    </div>
  </section>
</template>
