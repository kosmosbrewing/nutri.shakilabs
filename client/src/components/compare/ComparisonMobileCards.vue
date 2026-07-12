<script setup lang="ts">
import type { NutrientReference } from "@/data/types";
import type { ComparisonEntry } from "@/utils/comparison";
import { findNutrientCoverage, formatCoverageRatio, formatNutrientAmount } from "@/utils/comparison";
import { formatScore, formatWon } from "@/utils/ranking";

defineProps<{ entries: ComparisonEntry[]; references: NutrientReference[] }>();
</script>

<template>
  <div class="space-y-4 md:hidden">
    <article v-for="entry in entries" :key="entry.item.product.id" class="surface-panel overflow-hidden">
      <header class="border-b border-border/70 p-5">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-semibold text-primary">{{ entry.item.product.brand }}</p>
          <span class="confidence-badge">신뢰도 {{ entry.item.product.confidence }}</span>
        </div>
        <h2 class="mt-2 break-keep text-xl font-semibold leading-snug">{{ entry.item.product.officialName }}</h2>
        <p class="mt-2 text-xs text-muted-foreground">전체 가격효율 {{ entry.item.overallRank }}위</p>
      </header>

      <dl class="comparison-mobile-metrics grid grid-cols-2 gap-px bg-border/70">
        <div class="bg-card p-4">
          <dt class="metric-label">1일 비용</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums">{{ formatWon(entry.item.score.dailyCostKrw) }}</dd>
        </div>
        <div class="bg-card p-4">
          <dt class="metric-label">월 환산</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums">{{ formatWon(entry.item.score.monthlyCostKrw) }}</dd>
        </div>
        <div class="bg-card p-4">
          <dt class="metric-label">영양충족도</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums">{{ formatScore(entry.item.score.coverageScore) }}%</dd>
        </div>
        <div class="bg-card p-4">
          <dt class="metric-label">가격효율지수</dt>
          <dd class="mt-1 text-lg font-semibold tabular-nums text-primary">{{ formatScore(entry.item.score.valueIndex) }}</dd>
        </div>
      </dl>

      <details class="group">
        <summary class="touch-target flex cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold">
          23개 영양소 비교값
          <span aria-hidden="true" class="text-primary group-open:rotate-45">＋</span>
        </summary>
        <dl class="border-t border-border/70 px-5 py-2">
          <div v-for="reference in references" :key="reference.id" class="flex items-center justify-between gap-3 border-b border-border/45 py-2.5 last:border-0">
            <dt class="text-xs text-muted-foreground">{{ reference.name }}</dt>
            <dd v-if="findNutrientCoverage(entry, reference.id)" class="text-right text-xs tabular-nums">
              {{ formatNutrientAmount(findNutrientCoverage(entry, reference.id)!.dailyAmount) }}{{ reference.canonicalUnit }}
              <strong class="ml-1 text-primary">{{ formatCoverageRatio(findNutrientCoverage(entry, reference.id)!.ratio) }}</strong>
            </dd>
          </div>
        </dl>
      </details>
    </article>
  </div>
</template>
