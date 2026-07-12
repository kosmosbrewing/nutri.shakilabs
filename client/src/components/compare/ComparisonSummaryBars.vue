<script setup lang="ts">
import { computed, useId } from "vue";
import type { ComparisonEntry } from "@/utils/comparison";
import { positiveBarWidth } from "@/utils/chartMath";
import { formatScore, formatWon } from "@/utils/ranking";

type MetricValue = { key: string; label: string; value: number; emphasized: boolean };
type Metric = {
  key: string;
  label: string;
  maximum: number;
  values: MetricValue[];
  formatValue: (value: number) => string;
};
const props = defineProps<{ entries: ComparisonEntry[] }>();
const titleId = `comparison-summary-${useId()}`;

function label(entry: ComparisonEntry): string {
  return `${entry.item.product.brand} · ${entry.item.product.officialName}`;
}

const metrics = computed<Metric[]>(() => {
  const dailyCosts = props.entries.map((entry) => entry.item.score.dailyCostKrw);
  const coverageScores = props.entries.map((entry) => entry.item.score.coverageScore);
  const valueIndexes = props.entries.map((entry) => entry.item.score.valueIndex);
  const minimumCost = Math.min(...dailyCosts);
  const maximumCoverage = Math.max(...coverageScores);
  const maximumValue = Math.max(...valueIndexes);

  return [
    {
      key: "daily-cost",
      label: "배송비 포함 1일 비용",
      maximum: Math.max(...dailyCosts, 0),
      values: props.entries.map((entry) => ({ key: entry.item.product.id, label: label(entry), value: entry.item.score.dailyCostKrw, emphasized: entry.item.score.dailyCostKrw === minimumCost })),
      formatValue: formatWon,
    },
    {
      key: "coverage",
      label: "영양충족도 (100점 기준)",
      maximum: 100,
      values: props.entries.map((entry) => ({ key: entry.item.product.id, label: label(entry), value: entry.item.score.coverageScore, emphasized: entry.item.score.coverageScore === maximumCoverage })),
      formatValue: (value) => `${formatScore(value)}%`,
    },
    {
      key: "value-index",
      label: "가격효율지수 (선택 제품 내 상대 비교)",
      maximum: Math.max(...valueIndexes, 0),
      values: props.entries.map((entry) => ({ key: entry.item.product.id, label: label(entry), value: entry.item.score.valueIndex, emphasized: entry.item.score.valueIndex === maximumValue })),
      formatValue: formatScore,
    },
  ];
});
</script>

<template>
  <section class="surface-panel mt-5 p-5 sm:p-6" :aria-labelledby="titleId" data-comparison-summary-bars>
    <p class="eyebrow">핵심 지표 그래프</p>
    <h2 :id="titleId" class="mt-2 font-brand text-2xl">선택 제품 요약 비교</h2>
    <p class="mt-2 text-xs leading-5 text-muted-foreground">
      비용은 낮을수록, 영양충족도와 가격효율지수는 높을수록 강조합니다. 지표마다 단위와 축이 다르므로 서로 합산하지 않습니다.
    </p>
    <div class="mt-5 grid gap-6 lg:grid-cols-3">
      <div v-for="metric in metrics" :key="metric.key" class="space-y-3">
        <h3 class="border-b border-border/60 pb-2 text-xs font-semibold text-muted-foreground">{{ metric.label }}</h3>
        <div v-for="item in metric.values" :key="item.key" class="space-y-1.5">
          <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 text-xs">
            <span class="break-keep font-semibold leading-5" :class="item.emphasized ? 'text-primary' : 'text-foreground'">{{ item.label }}</span>
            <strong class="tabular-nums" :class="item.emphasized ? 'text-primary' : 'text-foreground'">{{ metric.formatValue(item.value) }}</strong>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-muted">
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
              <rect :width="positiveBarWidth(item.value, metric.maximum)" height="12" rx="4" :class="item.emphasized ? 'fill-primary' : 'fill-muted-foreground/45'" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
