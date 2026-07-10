<script setup lang="ts">
import {
  ShSurface,
  ShTable,
  ShTableBody,
  ShTableCell,
  ShTableHead,
  ShTableHeader,
  ShTableRow,
} from "@shakilabs/ui";
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
  <ShSurface class="hidden md:block" padding="none">
    <ShTable
      aria-label="선택한 영양제의 가격과 영양소 비교"
      density="compact"
      scroll-hint="표를 좌우로 스크롤해 선택한 제품을 모두 확인하세요."
    >
      <colgroup>
        <col class="w-36 lg:w-40" />
        <col v-for="entry in entries" :key="entry.item.product.id" />
      </colgroup>
      <ShTableHeader>
        <ShTableRow class="align-top">
          <ShTableHead>비교 항목</ShTableHead>
          <ShTableHead v-for="entry in entries" :key="entry.item.product.id">
            <span class="text-xs font-semibold text-primary">{{ entry.item.product.brand }}</span>
            <span class="mt-1 block break-keep leading-5">{{ entry.item.product.officialName }}</span>
            <span class="mt-2 block text-[11px] font-normal text-muted-foreground">효율 {{ entry.item.overallRank }}위 · 신뢰도 {{ entry.item.product.confidence }}</span>
          </ShTableHead>
        </ShTableRow>
      </ShTableHeader>
      <ShTableBody>
        <ShTableRow>
          <ShTableHead scope="row">배송비 포함 1일</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" numeric emphasis>{{ formatWon(entry.item.score.dailyCostKrw) }}</ShTableCell>
        </ShTableRow>
        <ShTableRow>
          <ShTableHead scope="row">월 환산 비용</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" numeric>{{ formatWon(entry.item.score.monthlyCostKrw) }}</ShTableCell>
        </ShTableRow>
        <ShTableRow>
          <ShTableHead scope="row">영양충족도</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" numeric>{{ formatScore(entry.item.score.coverageScore) }}%</ShTableCell>
        </ShTableRow>
        <ShTableRow>
          <ShTableHead scope="row">가격효율지수</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" numeric emphasis class="text-primary">{{ formatScore(entry.item.score.valueIndex) }}</ShTableCell>
        </ShTableRow>
        <ShTableRow>
          <ShTableHead scope="row">신고번호</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" class="break-all text-xs">{{ entry.item.product.reportNo }}</ShTableCell>
        </ShTableRow>
        <ShTableRow>
          <ShTableHead scope="row">가격 확인일</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" class="text-xs">{{ entry.item.offer.capturedAt }}</ShTableCell>
        </ShTableRow>
        <ShTableRow class="bg-accent/55">
          <ShTableHead :colspan="entries.length + 1" scope="colgroup" class="text-accent-foreground">
            영양소별 1일 함량 · 기준 충족률은 100%에서 상한
          </ShTableHead>
        </ShTableRow>
        <ShTableRow v-for="reference in references" :key="reference.id">
          <ShTableHead scope="row">{{ reference.name }}</ShTableHead>
          <ShTableCell v-for="entry in entries" :key="entry.item.product.id" numeric class="text-xs">
            <template v-if="nutrientValue(entry, reference.id)">
              {{ formatAmount(nutrientValue(entry, reference.id)!.dailyAmount) }}{{ reference.canonicalUnit }}
              <strong class="ml-1 text-primary">{{ formatCoverageRatio(nutrientValue(entry, reference.id)!.ratio) }}</strong>
            </template>
          </ShTableCell>
        </ShTableRow>
      </ShTableBody>
    </ShTable>
  </ShSurface>
</template>
