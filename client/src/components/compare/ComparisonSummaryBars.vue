<script setup lang="ts">
import { computed, useId } from "vue";
import type { ComparisonEntry } from "@/utils/comparison";
import { displayProductName } from "@/utils/comparison";
// 그래프 계산식은 공통 패키지 하나로 유지한다
import { positiveBarWidth } from "@shakilabs/ui";
import { formatScore, formatWon } from "@/utils/ranking";

type MetricValue = { key: string; order: number; brand: string; value: number; emphasized: boolean };
type Metric = {
  key: string;
  label: string;
  maximum: number;
  values: MetricValue[];
  formatValue: (value: number) => string;
};
const props = defineProps<{ entries: ComparisonEntry[] }>();
const titleId = `comparison-summary-${useId()}`;

const legend = computed(() => props.entries.map((entry, index) => ({
  key: entry.item.product.id,
  order: index + 1,
  brand: entry.item.product.brand,
  name: displayProductName(entry.item.product.brand, entry.item.product.officialName),
})));

const metrics = computed<Metric[]>(() => {
  const dailyCosts = props.entries.map((entry) => entry.item.score.dailyCostKrw);
  const coverageScores = props.entries.map((entry) => entry.item.score.coverageScore);
  const valueIndexes = props.entries.map((entry) => entry.item.score.valueIndex);
  const minimumCost = Math.min(...dailyCosts);
  const maximumCoverage = Math.max(...coverageScores);
  const maximumValue = Math.max(...valueIndexes);
  const values = (
    pick: (entry: ComparisonEntry) => number,
    emphasize: (value: number) => boolean,
  ): MetricValue[] => props.entries.map((entry, index) => ({
    key: entry.item.product.id,
    order: index + 1,
    brand: entry.item.product.brand,
    value: pick(entry),
    emphasized: emphasize(pick(entry)),
  }));

  return [
    {
      key: "daily-cost",
      label: "배송비 포함 1일 비용",
      maximum: Math.max(...dailyCosts, 0),
      values: values((entry) => entry.item.score.dailyCostKrw, (value) => value === minimumCost),
      formatValue: formatWon,
    },
    {
      key: "coverage",
      label: "영양충족도 (100점 기준)",
      maximum: 100,
      values: values((entry) => entry.item.score.coverageScore, (value) => value === maximumCoverage),
      formatValue: (value) => `${formatScore(value)}%`,
    },
    {
      key: "value-index",
      label: "가격효율지수",
      maximum: Math.max(...valueIndexes, 0),
      values: values((entry) => entry.item.score.valueIndex, (value) => value === maximumValue),
      formatValue: formatScore,
    },
  ];
});
</script>

<template>
  <section class="surface-panel mt-5 p-5 sm:p-6" :aria-labelledby="titleId" data-comparison-summary-bars>
    <p class="eyebrow">핵심 지표 그래프</p>
    <h2 :id="titleId" class="mt-2 font-brand text-2xl">선택 제품 요약 비교</h2>
    <p class="mt-2 text-xs leading-5 text-muted-foreground">비용은 낮을수록, 영양충족도·가격효율지수는 높을수록 강조합니다.</p>
    <ul class="mt-4 space-y-1.5">
      <li v-for="item in legend" :key="item.key" class="flex items-baseline gap-2 text-xs">
        <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full bg-primary/10 font-bold tabular-nums text-primary">{{ item.order }}</span>
        <span class="shrink-0 font-semibold text-primary">{{ item.brand }}</span>
        <span class="break-keep text-muted-foreground">{{ item.name }}</span>
      </li>
    </ul>
    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <div v-for="metric in metrics" :key="metric.key" class="space-y-3">
        <h3 class="border-b border-border/60 pb-2 text-xs font-semibold text-muted-foreground">{{ metric.label }}</h3>
        <div v-for="item in metric.values" :key="item.key" class="space-y-1.5">
          <div class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full font-bold tabular-nums" :class="item.emphasized ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">{{ item.order }}</span>
            <span class="truncate font-semibold" :class="item.emphasized ? 'text-primary' : 'text-foreground'">{{ item.brand }}</span>
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
