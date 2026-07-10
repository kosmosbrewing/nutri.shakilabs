<script setup lang="ts">
import type { ProductNutritionRow } from "@/utils/product-detail";
import { formatCoverageRatio } from "@/utils/comparison";

defineProps<{ rows: ProductNutritionRow[] }>();

function formatAmount(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}
</script>

<template>
  <div class="surface-panel overflow-hidden">
    <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-border bg-muted/45 px-4 py-3 text-[11px] font-semibold text-muted-foreground sm:px-5">
      <span>영양소</span>
      <span class="text-right">1일 함량</span>
      <span class="w-14 text-right">충족률</span>
    </div>
    <div
      v-for="row in rows"
      :key="row.reference.id"
      class="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border/55 px-4 py-2.5 last:border-0 sm:px-5"
      data-nutrient-row
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{{ row.reference.name }}</p>
        <p class="mt-0.5 text-[10px] text-muted-foreground">
          기준 {{ formatAmount(row.reference.dailyTarget) }}{{ row.reference.canonicalUnit }}
        </p>
      </div>
      <p v-if="row.nutrient.presence === 'verified'" class="text-right text-xs tabular-nums">
        {{ formatAmount(row.coverage.dailyAmount) }}{{ row.coverage.unit }}
      </p>
      <p v-else class="text-right text-[10px] text-muted-foreground">전체 라벨 미표시</p>
      <p class="w-14 text-right text-sm font-semibold tabular-nums" :class="row.coverage.ratio >= 1 ? 'text-primary' : 'text-foreground'">
        {{ formatCoverageRatio(row.coverage.ratio) }}
      </p>
    </div>
  </div>
</template>
