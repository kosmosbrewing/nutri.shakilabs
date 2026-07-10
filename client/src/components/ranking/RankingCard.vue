<script setup lang="ts">
import { computed } from "vue";
import type { RankingItem } from "@/utils/ranking";
import { formatScore, formatWon } from "@/utils/ranking";
import { trackAnalytics } from "@/utils/analytics";

const props = withDefaults(defineProps<{
  item: RankingItem;
  selected?: boolean;
  compareDisabled?: boolean;
}>(), {
  selected: false,
  compareDisabled: false,
});

defineEmits<{ toggleCompare: [productId: string] }>();

const coverageWidth = computed(() => `${Math.min(props.item.score.coverageScore, 100)}%`);
const capturedAt = computed(() => props.item.offer.capturedAt.replaceAll("-", "."));

function trackOfferClick(): void {
  trackAnalytics({
    name: "affiliate_click",
    product_id: props.item.product.id,
    seller: props.item.offer.seller,
    affiliate: props.item.offer.affiliate,
  });
}
</script>

<template>
  <article
    class="ranking-card"
    :class="item.overallRank === 1 ? 'ranking-card--top' : ''"
  >
    <div class="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[4rem_minmax(0,1.5fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_7rem] lg:items-center">
      <div class="flex items-center justify-between lg:block">
        <div
          class="grid h-12 w-12 shrink-0 place-items-center rounded-full font-brand text-lg"
          :class="item.overallRank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'"
          :aria-label="`전체 가격효율 ${item.overallRank}위`"
        >
          {{ item.overallRank }}
        </div>
        <span class="confidence-badge lg:mt-2">
          신뢰도 {{ item.product.confidence }}
        </span>
      </div>

      <div class="min-w-0">
        <div class="flex min-w-0 items-center gap-2">
          <span class="brand-mark" aria-hidden="true">{{ item.product.brand.slice(0, 1) }}</span>
          <p class="truncate text-xs font-semibold text-primary">{{ item.product.brand }}</p>
        </div>
        <h3 class="mt-2 break-keep text-lg font-semibold leading-snug sm:text-xl">
          <RouterLink class="inline-flex min-h-11 items-center decoration-primary/35 underline-offset-4 hover:text-primary hover:underline" :to="`/products/${item.product.slug}`">
            {{ item.product.officialName }}
          </RouterLink>
        </h3>
        <p class="mt-2 text-xs leading-5 text-muted-foreground">
          신고번호 {{ item.product.reportNo }} · 1일 {{ item.product.unitsPerServing }}정
        </p>
      </div>

      <div class="metric-block">
        <p class="metric-label">배송비 포함 1일</p>
        <p class="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {{ formatWon(item.score.dailyCostKrw) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          월 {{ formatWon(item.score.monthlyCostKrw) }}
        </p>
      </div>

      <div class="metric-block">
        <div class="flex items-end justify-between gap-2">
          <p class="metric-label">영양충족도</p>
          <p class="text-lg font-semibold tabular-nums">{{ formatScore(item.score.coverageScore) }}%</p>
        </div>
        <div
          :aria-label="`영양충족도 ${formatScore(item.score.coverageScore)}%`"
          :aria-valuenow="item.score.coverageScore"
          aria-valuemin="0"
          aria-valuemax="100"
          class="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <span class="block h-full rounded-full bg-primary" :style="{ width: coverageWidth }" />
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          {{ item.nutrientCount }}종 중 {{ item.metNutrientCount }}종 기준 충족
        </p>
      </div>

      <div class="flex items-end justify-between gap-4 lg:block lg:text-right">
        <div>
          <p class="metric-label">가격효율지수</p>
          <p class="mt-1 font-brand text-2xl text-primary">{{ formatScore(item.score.valueIndex) }}</p>
        </div>
        <div class="flex flex-wrap justify-end gap-1.5 lg:mt-2">
          <a
            class="touch-target inline-flex items-center rounded-lg border border-border px-2.5 text-xs font-semibold hover:border-primary hover:text-primary"
            :href="item.offer.url"
            rel="noopener noreferrer"
            target="_blank"
            @click="trackOfferClick"
          >
            가격 원문
          </a>
          <button
            class="touch-target rounded-lg border px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            :class="selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary'"
            :disabled="compareDisabled"
            type="button"
            :aria-pressed="selected"
            @click="$emit('toggleCompare', item.product.id)"
          >
            {{ selected ? '비교 취소' : '비교 담기' }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/25 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
      <span>가격 확인 {{ capturedAt }} · 비제휴 링크</span>
      <span>성분별 기준 충족률은 100%에서 상한</span>
    </div>
  </article>
</template>
