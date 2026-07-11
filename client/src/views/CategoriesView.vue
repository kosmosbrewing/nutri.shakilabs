<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";
import CategoryGrid from "@/components/category/CategoryGrid.vue";
import { publicDataSnapshot } from "@/data/public-snapshot";
import { categoryCards, categoryCatalog } from "@/utils/category-catalog";

const officialRecordCount = categoryCatalog.categories.reduce(
  (sum, category) => sum + category.recordCount,
  0,
);
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main>
      <section class="hero-field border-b border-border/60">
        <div class="container py-10 sm:py-14">
          <p class="eyebrow">Supplement categories</p>
          <h1 class="mt-4 max-w-3xl break-keep font-brand text-[2.15rem] leading-tight tracking-[-0.035em] sm:text-5xl">
            영양제는 목적이 다르면<br />점수표도 달라야 합니다.
          </h1>
          <p class="mt-5 max-w-2xl break-keep text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {{ publicDataSnapshot.rowCount.toLocaleString("ko-KR") }}건의 식약처 제공 표준데이터에서 자주 찾는 제품군을 분리했습니다. 서로 다른 종류를 한 순위에 섞지 않습니다.
          </p>
          <div class="mt-7 grid max-w-2xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card py-4 text-center">
            <div class="px-2"><p class="text-[11px] text-muted-foreground">탐색 범위</p><p class="mt-1 font-semibold">10개 종류</p></div>
            <div class="px-2"><p class="text-[11px] text-muted-foreground">카테고리 레코드</p><p class="mt-1 font-semibold tabular-nums">{{ officialRecordCount.toLocaleString("ko-KR") }}건</p></div>
            <div class="px-2"><p class="text-[11px] text-muted-foreground">기준일</p><p class="mt-1 font-semibold">{{ categoryCatalog.source.dataReferenceDate.replaceAll("-", ".") }}</p></div>
          </div>
        </div>
      </section>

      <section class="container py-10 sm:py-14">
        <div class="mb-6 max-w-2xl">
          <p class="eyebrow">Choose a lane</p>
          <h2 class="mt-2 font-brand text-2xl sm:text-3xl">영양제 종류별로 확인하기</h2>
          <p class="mt-3 break-keep text-sm leading-6 text-muted-foreground">
            멀티비타민은 23개 영양소 가격효율, 나머지 9개 종류는 각 핵심 성분의 독립 단위가격과 공식 등록 예시를 제공합니다.
          </p>
        </div>
        <CategoryGrid :categories="categoryCards" />
      </section>

      <section class="border-y border-border/70 bg-muted/35">
        <div class="container grid gap-6 py-10 sm:grid-cols-3">
          <div><p class="method-number">01</p><h2 class="mt-2 font-semibold">등록과 판매를 구분</h2><p class="mt-2 text-sm leading-6 text-muted-foreground">공식 레코드는 현재 판매 여부나 재고를 보장하지 않습니다.</p></div>
          <div><p class="method-number">02</p><h2 class="mt-2 font-semibold">종류별 독립 기준</h2><p class="mt-2 text-sm leading-6 text-muted-foreground">오메가3와 유산균처럼 핵심 단위가 다른 제품을 한 점수로 합치지 않습니다.</p></div>
          <div><p class="method-number">03</p><h2 class="mt-2 font-semibold">근거가 찬 뒤 랭킹</h2><p class="mt-2 text-sm leading-6 text-muted-foreground">핵심 함량·총 복용일수·최신 가격을 검증한 뒤에만 순위를 엽니다.</p></div>
        </div>
      </section>
    </main>
  </div>
</template>
