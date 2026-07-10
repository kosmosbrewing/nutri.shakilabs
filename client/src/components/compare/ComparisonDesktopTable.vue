<script setup lang="ts">
import type { NutrientReference } from "@/data/types";
import type { ComparisonEntry } from "@/utils/comparison";
import { formatCoverageRatio } from "@/utils/comparison";
import { formatScore, formatWon } from "@/utils/ranking";

defineProps<{ entries: ComparisonEntry[]; references: NutrientReference[] }>();

function nutrientValue(entry: ComparisonEntry, nutrientId: string) {
  return entry.item.score.coverage.find((coverage) => coverage.nutrientId === nutrientId);
}

function formatAmount(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}
</script>

<template>
  <div class="surface-panel hidden overflow-hidden md:block">
    <table class="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col class="w-36 lg:w-40" />
        <col v-for="entry in entries" :key="entry.item.product.id" />
      </colgroup>
      <thead>
        <tr class="bg-muted/55 text-left align-top">
          <th class="border-b border-r border-border p-4 text-xs text-muted-foreground">비교 항목</th>
          <th v-for="entry in entries" :key="entry.item.product.id" class="border-b border-r border-border p-4 last:border-r-0">
            <span class="text-xs font-semibold text-primary">{{ entry.item.product.brand }}</span>
            <span class="mt-1 block break-keep leading-5">{{ entry.item.product.officialName }}</span>
            <span class="mt-2 block text-[11px] font-normal text-muted-foreground">효율 {{ entry.item.overallRank }}위 · 신뢰도 {{ entry.item.product.confidence }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th class="compare-row-label">배송비 포함 1일</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value font-semibold">{{ formatWon(entry.item.score.dailyCostKrw) }}</td>
        </tr>
        <tr>
          <th class="compare-row-label">월 환산 비용</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value">{{ formatWon(entry.item.score.monthlyCostKrw) }}</td>
        </tr>
        <tr>
          <th class="compare-row-label">영양충족도</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value">{{ formatScore(entry.item.score.coverageScore) }}%</td>
        </tr>
        <tr>
          <th class="compare-row-label">가격효율지수</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value font-semibold text-primary">{{ formatScore(entry.item.score.valueIndex) }}</td>
        </tr>
        <tr>
          <th class="compare-row-label">신고번호</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value break-all text-xs">{{ entry.item.product.reportNo }}</td>
        </tr>
        <tr>
          <th class="compare-row-label">가격 확인일</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value text-xs">{{ entry.item.offer.capturedAt }}</td>
        </tr>
        <tr class="bg-accent/55">
          <th :colspan="entries.length + 1" class="border-b border-border px-4 py-3 text-left text-xs font-semibold text-accent-foreground">
            영양소별 1일 함량 · 기준 충족률은 100%에서 상한
          </th>
        </tr>
        <tr v-for="reference in references" :key="reference.id">
          <th class="compare-row-label">{{ reference.name }}</th>
          <td v-for="entry in entries" :key="entry.item.product.id" class="compare-value text-xs tabular-nums">
            <template v-if="nutrientValue(entry, reference.id)">
              {{ formatAmount(nutrientValue(entry, reference.id)!.dailyAmount) }}{{ reference.canonicalUnit }}
              <strong class="ml-1 text-primary">{{ formatCoverageRatio(nutrientValue(entry, reference.id)!.ratio) }}</strong>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
