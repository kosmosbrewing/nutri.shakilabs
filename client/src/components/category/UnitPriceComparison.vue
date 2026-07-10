<script setup lang="ts">
import type { UnitPriceRanking } from "@/utils/unit-price";
import { formatUnitPriceAmount, formatUnitPriceWon } from "@/utils/unit-price";

defineProps<{ ranking: UnitPriceRanking }>();
</script>

<template>
  <section
    class="border-b border-border/60 bg-accent/25"
    :data-unit-price-section="ranking.category.slug"
  >
    <div class="container py-10 sm:py-14">
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div>
          <p class="eyebrow">Unit price comparison</p>
          <h2 class="mt-2 break-keep font-brand text-3xl sm:text-4xl">
            {{ ranking.category.name }} 단위가격 비교
          </h2>
          <p class="mt-4 max-w-3xl break-keep text-sm leading-6 text-muted-foreground sm:text-base">
            {{ ranking.category.summary }}입니다. 배송비와 세트 수량을 포함하며 같은 카테고리 안에서만 비교합니다.
          </p>
        </div>
        <div class="rounded-xl border border-primary/20 bg-card p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Comparison basis</p>
          <p class="mt-2 font-brand text-xl text-primary">{{ ranking.category.basisLabel }}</p>
          <p class="mt-2 text-xs leading-5 text-muted-foreground">unit-price-v1 · 가격 확인 {{ ranking.updatedAt.replaceAll("-", ".") }}</p>
        </div>
      </div>

      <ol class="mt-7 grid gap-4 lg:grid-cols-3">
        <li
          v-for="score in ranking.scores"
          :key="score.product.id"
          class="min-w-0 overflow-hidden rounded-xl border bg-card"
          :class="score.rank === 1 ? 'border-primary/45 shadow-lift' : 'border-border'"
          :data-unit-price-card="score.product.id"
        >
          <article class="flex h-full flex-col">
            <div class="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
              <span
                class="grid h-9 w-9 place-items-center rounded-full font-brand text-sm"
                :class="score.rank === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                :aria-label="`${ranking.category.name} 단위가격 ${score.rank}위`"
              >
                {{ score.rank }}
              </span>
              <span class="confidence-badge">신뢰도 {{ score.product.confidence }}</span>
            </div>

            <div class="flex flex-1 flex-col p-5">
              <p class="text-xs font-semibold text-primary">{{ score.product.brand }}</p>
              <h3 class="mt-2 min-h-14 break-keep text-lg font-semibold leading-7">{{ score.product.displayName }}</h3>
              <div class="mt-5 rounded-lg bg-accent/65 p-4">
                <p class="metric-label">{{ ranking.category.basisLabel }}</p>
                <p class="mt-1 font-brand text-3xl tabular-nums text-primary">{{ formatUnitPriceWon(score.unitPriceKrw) }}</p>
              </div>

              <dl class="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border border-border py-3 text-center">
                <div class="min-w-0 px-2">
                  <dt class="text-[10px] text-muted-foreground">1일 함량</dt>
                  <dd class="mt-1 truncate text-xs font-semibold tabular-nums">{{ formatUnitPriceAmount(score.product.dailyActiveAmount, score.product.activeUnit) }}</dd>
                </div>
                <div class="min-w-0 px-2">
                  <dt class="text-[10px] text-muted-foreground">1일 비용</dt>
                  <dd class="mt-1 truncate text-xs font-semibold tabular-nums">{{ formatUnitPriceWon(score.dailyCostKrw) }}</dd>
                </div>
                <div class="min-w-0 px-2">
                  <dt class="text-[10px] text-muted-foreground">30일 비용</dt>
                  <dd class="mt-1 truncate text-xs font-semibold tabular-nums">{{ formatUnitPriceWon(score.monthlyCostKrw) }}</dd>
                </div>
              </dl>

              <p class="mt-4 break-keep text-xs leading-5 text-muted-foreground">
                {{ score.product.servingLabel }} · {{ score.product.packageLabel }} · 총 {{ score.totalDays.toLocaleString("ko-KR") }}일분
              </p>
              <div class="mt-auto flex flex-wrap gap-2 pt-5 text-xs font-semibold">
                <a
                  class="touch-target inline-flex items-center rounded-lg border border-border px-3 hover:border-primary hover:text-primary"
                  :href="ranking.publicSourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-unit-price-source="official"
                >공식 신고 {{ score.product.reportNo }} ↗</a>
                <a
                  class="touch-target inline-flex items-center rounded-lg border border-border px-3 hover:border-primary hover:text-primary"
                  :href="score.product.offer.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-unit-price-source="price"
                >가격 원문 ↗</a>
              </div>
            </div>
            <div class="border-t border-border/60 bg-muted/25 px-5 py-2.5 text-[11px] text-muted-foreground">
              배송비 포함 · {{ score.product.offer.seller }} · 비제휴 링크
            </div>
          </article>
        </li>
      </ol>

      <div class="mt-5 rounded-xl border border-status-warning/30 bg-card px-5 py-4 text-sm leading-6">
        <strong class="font-semibold">해석 주의</strong>
        <span class="ml-2 break-keep text-muted-foreground">낮은 단위가격은 구매 판단의 한 요소일 뿐입니다. 고함량 제품의 복용 권장이나 개인 적합성을 뜻하지 않으며, 원료 형태·기타 성분·흡수율은 이 순위에 반영하지 않습니다.</span>
      </div>
    </div>
  </section>
</template>
