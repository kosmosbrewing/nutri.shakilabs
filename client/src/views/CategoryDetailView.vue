<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "@/components/SiteHeader.vue";
import CategoryRecordCard from "@/components/category/CategoryRecordCard.vue";
import UnitPriceComparison from "@/components/category/UnitPriceComparison.vue";
import { publicDataSnapshot } from "@/data/public-snapshot";
import { findCategory } from "@/utils/category-catalog";
import { resolveUnitPriceRanking } from "@/utils/unit-price";

const route = useRoute();
const category = computed(() => findCategory(route.params.slug));
const unitPriceRanking = computed(() => resolveUnitPriceRanking(route.params.slug));
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main v-if="category">
      <section class="hero-field border-b border-border/60">
        <div class="container py-9 sm:py-12">
          <a class="touch-target inline-flex items-center text-sm font-semibold text-primary" href="/nutri/categories">← 전체 영양제 종류</a>
          <div class="mt-6 grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{{ unitPriceRanking ? "가격효율 비교" : "공식 목록" }}</span>
                <span class="rounded-full border border-status-warning/30 px-2.5 py-1 text-[10px] font-semibold text-status-warning">{{ unitPriceRanking ? "동일 성분 내 비교" : "순위가 아닙니다" }}</span>
              </div>
              <h1 class="mt-4 break-keep font-brand text-[2.15rem] leading-tight tracking-[-0.035em] sm:text-5xl">{{ category.name }} 영양제<br />{{ unitPriceRanking ? "가격효율·단위가격 비교" : "공식 등록 제품 찾기" }}</h1>
              <p class="mt-5 max-w-2xl break-keep text-base leading-7 text-muted-foreground">{{ unitPriceRanking ? unitPriceRanking.category.summary : `${category.summary}을 보여줍니다. 아래 제품은 최근 생성일과 제조사 다양성을 기준으로 추린 예시입니다.` }}</p>
            </div>
            <dl class="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-card py-4 text-center">
              <div class="px-3"><dt class="text-[11px] text-muted-foreground">{{ unitPriceRanking ? "검증 제품" : "공식 레코드" }}</dt><dd class="mt-1 font-brand text-2xl text-primary">{{ unitPriceRanking ? unitPriceRanking.scores.length : category.recordCount.toLocaleString("ko-KR") }}</dd></div>
              <div class="px-3"><dt class="text-[11px] text-muted-foreground">{{ unitPriceRanking ? "가격 기준일" : "표시 예시" }}</dt><dd class="mt-1 font-brand" :class="unitPriceRanking ? 'text-base' : 'text-2xl'">{{ unitPriceRanking ? unitPriceRanking.updatedAt.replaceAll("-", ".") : category.records.length }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <UnitPriceComparison v-if="unitPriceRanking" :ranking="unitPriceRanking" />

      <section class="container py-10 sm:py-14">
        <div class="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <div class="mb-5">
              <p class="eyebrow">공식 등록 목록</p>
              <h2 class="mt-2 font-brand text-2xl">식약처 제공 데이터 등록 예시</h2>
              <p class="mt-3 break-keep text-xs leading-5 text-muted-foreground">등록 레코드에는 수입·신고 변형이 포함될 수 있으며 고유 상품 수나 판매 중인 상품 수와 같지 않습니다.</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <CategoryRecordCard v-for="record in category.records" :key="record.reportNo" :category="category" :record="record" />
            </div>
          </div>

          <aside class="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-5">
            <p class="eyebrow">{{ unitPriceRanking ? "Comparison scope" : "Ranking readiness" }}</p>
            <h2 class="mt-2 break-keep font-semibold">{{ unitPriceRanking ? "현재 비교 범위" : "향후 비교 기준" }}</h2>
            <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ category.comparisonBasis }}</p>
            <h3 class="mt-6 text-xs font-semibold">{{ unitPriceRanking ? "반영하지 않는 요소" : "추가로 필요한 근거" }}</h3>
            <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
              <li v-for="evidence in unitPriceRanking ? ['원료 형태와 흡수율', '핵심 성분 외 기타 영양소', '개인별 적정 섭취량'] : category.nextEvidence" :key="evidence" class="flex gap-2"><span class="text-primary" aria-hidden="true">•</span><span>{{ evidence }}</span></li>
            </ul>
            <a class="touch-target mt-6 inline-flex items-center text-sm font-semibold text-primary" :href="publicDataSnapshot.sourceUrl" target="_blank" rel="noopener noreferrer">공공데이터 원문 확인 ↗</a>
          </aside>
        </div>
      </section>
    </main>
    <main v-else class="page-shell">
      <h1 class="font-brand text-3xl">카테고리를 찾을 수 없습니다</h1>
      <a class="touch-target mt-5 inline-flex items-center font-semibold text-primary" href="/nutri/categories">전체 종류로 돌아가기</a>
    </main>
  </div>
</template>
