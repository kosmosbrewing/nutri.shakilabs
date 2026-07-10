<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";
import ComparisonTray from "@/components/compare/ComparisonTray.vue";
import RankingCard from "@/components/ranking/RankingCard.vue";
import RankingFilters from "@/components/ranking/RankingFilters.vue";
import { useComparison } from "@/composables/useComparison";
import { useRanking } from "@/composables/useRanking";
import { formatScore, formatWon } from "@/utils/ranking";

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
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />

    <main>
      <section class="hero-field overflow-hidden border-b border-border/60">
        <div class="container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <div class="relative z-10 max-w-2xl">
            <p class="eyebrow">공공데이터 + 판매가 근거 · 2026.07.10</p>
            <h1 class="mt-4 break-keep font-brand text-[2.15rem] leading-[1.18] tracking-[-0.035em] sm:text-5xl sm:leading-[1.14]">
              멀티비타민,<br class="hidden lg:block" /> 하루 비용으로<br class="hidden lg:block" /> 다시 비교했습니다.
            </h1>
            <p class="mt-5 max-w-xl break-keep text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              23개 영양소의 기준 충족률을 100%에서 멈추고, 배송비를 포함한 1일 비용으로 나눴습니다. 함량이 높다는 말보다 실제 비교 근거를 먼저 확인하세요.
            </p>
            <div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span class="trust-chip">식약처 신고번호 확인</span>
              <span class="trust-chip">가격 확인일 공개</span>
              <span class="trust-chip">제휴 무관 동일 산식</span>
            </div>
            <a class="mt-7 inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:brightness-95" href="#ranking">
              10개 제품 순위 보기
            </a>
          </div>

          <aside v-if="topItem" class="surface-panel relative overflow-hidden p-5 sm:p-6" aria-label="현재 가격효율 1위">
            <div class="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-accent" aria-hidden="true" />
            <div class="relative">
              <div class="flex items-center justify-between gap-3">
                <p class="eyebrow">현재 가격효율 1위</p>
                <span class="confidence-badge">신뢰도 {{ topItem.product.confidence }}</span>
              </div>
              <p class="mt-7 text-sm font-semibold text-primary">{{ topItem.product.brand }}</p>
              <h2 class="mt-1 break-keep font-brand text-2xl leading-snug">
                {{ topItem.product.officialName }}
              </h2>
              <div class="mt-6 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background/80 py-4 text-center">
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
          </aside>
        </div>
      </section>

      <section id="ranking" class="container scroll-mt-4 py-10 sm:py-14" :class="selectedItems.length ? 'pb-36 sm:pb-44' : ''">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow">Value ranking</p>
            <h2 class="mt-2 font-brand text-2xl sm:text-3xl">가격당 영양효율 순위</h2>
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
          @update="updateFilter"
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

    <footer class="container py-8 text-xs leading-5 text-muted-foreground">
      영양만점은 영양정보 비교 도구이며 질환의 진단·치료·예방을 위한 의료 조언을 제공하지 않습니다.
    </footer>
  </div>
</template>
