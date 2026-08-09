<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";
import CategoryGrid from "@/components/category/CategoryGrid.vue";
import { publicDataSnapshot } from "@/data/public-snapshot";
import {
  categoryGuideClosing,
  categoryGuideIntro,
  categoryGuideTable,
  categoryStatusGuides,
  categoryStatusLabels,
} from "@/data/category-guide";
import { categoryCards, categoryCatalog, categoryGuideRows } from "@/utils/category-catalog";

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
          <p class="eyebrow">종류별 가격효율 순위</p>
          <h1 class="mt-4 max-w-3xl break-keep font-brand text-[2.15rem] leading-tight tracking-[-0.035em] sm:text-5xl">
            영양제는 목적이 다르면<br />점수표도 달라야 합니다.
          </h1>
          <p class="mt-5 max-w-2xl break-keep text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {{ publicDataSnapshot.rowCount.toLocaleString("ko-KR") }}건의 식약처 제공 표준데이터에서 자주 찾는 제품군을 분리했습니다. 서로 다른 종류를 한 순위에 섞지 않습니다.
          </p>
          <div class="category-summary-grid mt-7 grid max-w-2xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card py-4 text-center">
            <div class="px-2"><p class="text-[11px] text-muted-foreground">탐색 범위</p><p class="mt-1 font-semibold">10개 종류</p></div>
            <div class="px-2"><p class="text-[11px] text-muted-foreground">카테고리 레코드</p><p class="mt-1 font-semibold tabular-nums">{{ officialRecordCount.toLocaleString("ko-KR") }}건</p></div>
            <div class="px-2"><p class="text-[11px] text-muted-foreground">기준일</p><p class="mt-1 font-semibold">{{ categoryCatalog.source.dataReferenceDate.replaceAll("-", ".") }}</p></div>
          </div>
        </div>
      </section>

      <section class="container py-10 sm:py-14">
        <div class="mb-6 max-w-2xl">
          <p class="eyebrow">10개 영양제 종류</p>
          <h2 class="mt-2 font-brand text-2xl sm:text-3xl">영양제 종류별로 확인하기</h2>
          <p class="mt-3 break-keep text-sm leading-6 text-muted-foreground">
            멀티비타민은 23개 영양소 종합 랭킹, 나머지 9개 종류는 핵심 성분 단위가격 순위입니다.
          </p>
        </div>
        <CategoryGrid :categories="categoryCards" />
      </section>

      <section class="container pb-10 sm:pb-14" aria-labelledby="category-guide-title">
        <div class="max-w-3xl">
          <p class="eyebrow">{{ categoryGuideIntro.eyebrow }}</p>
          <h2 id="category-guide-title" class="mt-2 break-keep font-brand text-2xl sm:text-3xl">
            {{ categoryGuideIntro.heading }}
          </h2>
          <p
            v-for="paragraph in categoryGuideIntro.paragraphs"
            :key="paragraph"
            class="mt-3 break-keep text-sm leading-7 text-muted-foreground"
          >{{ paragraph }}</p>
        </div>

        <div class="mt-6 grid gap-3 lg:grid-cols-3">
          <article
            v-for="guide in categoryStatusGuides"
            :key="guide.status"
            class="rounded-xl border border-border bg-card p-5"
            :data-category-status-guide="guide.status"
          >
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
              :class="guide.status === 'ranking' ? 'bg-primary text-primary-foreground' : guide.status === 'unit_price' ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground'"
            >{{ guide.label }}</span>
            <h3 class="mt-3 break-keep font-semibold">{{ guide.title }}</h3>
            <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ guide.body }}</p>
          </article>
        </div>
      </section>

      <section class="container pb-10 sm:pb-14" aria-labelledby="category-basis-title">
        <div class="max-w-3xl">
          <p class="eyebrow">{{ categoryGuideTable.eyebrow }}</p>
          <h2 id="category-basis-title" class="mt-2 break-keep font-brand text-2xl sm:text-3xl">
            {{ categoryGuideTable.heading }}
          </h2>
          <p class="mt-3 break-keep text-sm leading-6 text-muted-foreground">{{ categoryGuideTable.lead }}</p>
        </div>

        <ul class="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          <li
            v-for="row in categoryGuideRows"
            :key="row.slug"
            class="grid gap-2 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-4"
            :data-category-basis="row.slug"
          >
            <a class="touch-target inline-flex items-center font-semibold text-primary" :href="row.href">{{ row.name }}</a>
            <p class="break-keep text-sm leading-6 text-muted-foreground">
              <span class="text-foreground">{{ categoryGuideTable.basisLabel }}</span> · {{ row.basis }}
            </p>
            <p class="text-xs text-muted-foreground sm:text-right">
              {{ categoryStatusLabels[row.status] }}<br class="hidden sm:block" />
              <span class="tabular-nums">{{ row.countLabel }}</span>
            </p>
          </li>
        </ul>

        <p class="mt-5 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">{{ categoryGuideClosing }}</p>
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
