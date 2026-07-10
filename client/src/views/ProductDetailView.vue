<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "@/components/SiteHeader.vue";
import SourceCard from "@/components/evidence/SourceCard.vue";
import ProductNutritionTable from "@/components/product/ProductNutritionTable.vue";
import { useRanking } from "@/composables/useRanking";
import { nutriDataset } from "@/data/dataset";
import { buildProductDetail, parseProductSlug } from "@/utils/product-detail";
import { formatScore, formatWon } from "@/utils/ranking";

const route = useRoute();
const { allItems, dataError } = useRanking();
const validSlugs = allItems.map((item) => item.product.slug);
const slugResult = computed(() => parseProductSlug(route.params.slug, validSlugs));
const detail = computed(() => {
  const currentSlug = slugResult.value;
  if (!currentSlug.success) return null;
  const item = allItems.find((candidate) => candidate.product.slug === currentSlug.slug);
  return item ? buildProductDetail(nutriDataset, item) : null;
});
const pageError = computed(() => dataError
  ?? (slugResult.value.success ? null : slugResult.value.detail)
  ?? (detail.value ? null : "제품 근거를 구성할 수 없습니다."));
const absentCount = computed(() => detail.value?.nutritionRows
  .filter((row) => row.nutrient.presence === "absent").length ?? 0);
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main class="container py-8 sm:py-12">
      <nav aria-label="현재 위치" class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <RouterLink class="touch-target inline-flex items-center font-semibold text-primary" :to="{ path: '/', hash: '#ranking' }">가격효율 순위</RouterLink>
        <span aria-hidden="true">/</span>
        <span>제품 근거</span>
      </nav>

      <section v-if="pageError" class="surface-panel mt-6 px-5 py-12 text-center" role="alert">
        <h1 class="font-brand text-2xl">제품을 찾을 수 없습니다</h1>
        <p class="mt-2 text-sm text-muted-foreground">{{ pageError }}</p>
        <RouterLink class="touch-target mt-5 inline-flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" :to="{ path: '/', hash: '#ranking' }">
          검증 제품 보기
        </RouterLink>
      </section>

      <template v-else-if="detail">
        <header class="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="confidence-badge">신뢰도 {{ detail.item.product.confidence }}</span>
              <span class="text-xs font-semibold text-primary">가격효율 {{ detail.item.overallRank }}위</span>
            </div>
            <p class="mt-5 text-sm font-semibold text-primary">{{ detail.item.product.brand }}</p>
            <h1 class="mt-2 break-keep font-brand text-3xl leading-tight sm:text-4xl">{{ detail.item.product.officialName }}</h1>
            <p class="mt-4 break-keep text-sm leading-6 text-muted-foreground">
              식약처 신고번호 {{ detail.item.product.reportNo }} · {{ detail.item.product.manufacturer }} 제조
            </p>
          </div>

          <div class="surface-panel grid grid-cols-2 gap-px overflow-hidden bg-border/70">
            <div class="bg-card p-4">
              <p class="metric-label">배송비 포함 1일</p>
              <p class="mt-1 text-xl font-semibold">{{ formatWon(detail.item.score.dailyCostKrw) }}</p>
            </div>
            <div class="bg-card p-4">
              <p class="metric-label">월 환산</p>
              <p class="mt-1 text-xl font-semibold">{{ formatWon(detail.item.score.monthlyCostKrw) }}</p>
            </div>
            <div class="bg-card p-4">
              <p class="metric-label">영양충족도</p>
              <p class="mt-1 text-xl font-semibold">{{ formatScore(detail.item.score.coverageScore) }}%</p>
            </div>
            <div class="bg-card p-4">
              <p class="metric-label">가격효율지수</p>
              <p class="mt-1 text-xl font-semibold text-primary">{{ formatScore(detail.item.score.valueIndex) }}</p>
            </div>
          </div>
        </header>

        <section class="mt-10 grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div>
            <div class="mb-4">
              <p class="eyebrow">Daily nutrition</p>
              <h2 class="mt-2 font-brand text-2xl">영양소별 1일 함량</h2>
              <p class="mt-2 text-xs leading-5 text-muted-foreground">
                23개 공통 기준 · 기준 충족률 100% 상한 · 전체 라벨 미표시 {{ absentCount }}개
              </p>
            </div>
            <ProductNutritionTable :rows="detail.nutritionRows" />
          </div>

          <aside class="surface-panel p-5 lg:sticky lg:top-5">
            <p class="eyebrow">Price evidence</p>
            <h2 class="mt-2 text-lg font-semibold">가격 계산 내역</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">판매가</dt><dd class="font-semibold">{{ formatWon(detail.item.offer.listedPriceKrw) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">필수 배송비</dt><dd class="font-semibold">{{ formatWon(detail.item.offer.mandatoryShippingKrw) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">묶음 수량</dt><dd class="font-semibold">{{ detail.item.offer.quantityMultiplier }}개</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-muted-foreground">총 복용일</dt><dd class="font-semibold">{{ detail.item.product.totalDays * detail.item.offer.quantityMultiplier }}일</dd></div>
              <div class="flex justify-between gap-3 border-t border-border pt-3"><dt class="text-muted-foreground">확인일</dt><dd class="font-semibold">{{ detail.item.offer.capturedAt }}</dd></div>
            </dl>
            <a class="touch-target mt-5 inline-flex w-full items-center justify-center rounded-lg border border-primary text-sm font-semibold text-primary hover:bg-accent" :href="detail.item.offer.url" rel="noopener noreferrer" target="_blank">
              가격 원문 · 비제휴 ↗
            </a>
            <RouterLink class="touch-target mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground" to="/methodology">
              점수 계산법 보기
            </RouterLink>
          </aside>
        </section>

        <section class="mt-10" aria-labelledby="product-evidence-title">
          <p class="eyebrow">Source trail</p>
          <h2 id="product-evidence-title" class="mt-2 font-brand text-2xl">이 제품의 근거</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SourceCard v-for="source in detail.sources" :key="source.id" :source="source" />
          </div>
        </section>

        <section class="mt-10 rounded-xl border border-status-warning/30 bg-card p-5 text-sm leading-6">
          <h2 class="font-semibold">섭취 전 확인</h2>
          <p class="mt-2 text-muted-foreground">이 페이지는 일반 성인용 라벨 비교이며 개인 처방이 아닙니다. 임신·수유, 질환, 복약 중이라면 제품의 섭취 주의사항을 확인하고 전문가와 상담하세요.</p>
        </section>
      </template>
    </main>
  </div>
</template>
