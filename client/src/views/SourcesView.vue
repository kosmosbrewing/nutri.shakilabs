<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";
import SourceCard from "@/components/evidence/SourceCard.vue";
import { nutriDataset } from "@/data/dataset";
import { publicDataSnapshot } from "@/data/public-snapshot";
import { formatUnitPriceAmount, unitPriceDataset } from "@/utils/unit-price";

const generalSources = nutriDataset.sources.filter((source) => source.productId === null);
const productGroups = nutriDataset.products.map((product) => ({
  product,
  sources: nutriDataset.sources.filter((source) => source.productId === product.id),
}));
const unitPriceGroups = unitPriceDataset.categories.map((category) => ({
  category,
  products: category.products,
}));
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main class="container py-8 sm:py-12">
      <nav aria-label="현재 위치" class="text-xs text-muted-foreground">
        <a class="touch-target inline-flex items-center font-semibold text-primary" href="/nutri">영양만점</a>
        <span class="mx-2" aria-hidden="true">/</span><span>출처</span>
      </nav>

      <header class="mt-5 max-w-3xl">
        <p class="eyebrow">출처 카탈로그</p>
        <h1 class="mt-3 break-keep font-brand text-3xl leading-tight sm:text-4xl">숫자마다 원문과 확인일을 연결합니다</h1>
        <p class="mt-5 break-keep text-base leading-7 text-muted-foreground">공공데이터는 제품 식별의 기준축으로, 제조사·판매 페이지는 전체 라벨과 가격의 보강 근거로 사용합니다. 원문 이미지 대신 구조화 값과 링크, 검증 해시를 보관합니다.</p>
      </header>

      <section class="mt-8 surface-panel overflow-hidden" aria-labelledby="snapshot-title">
        <div class="grid gap-px bg-border/70 sm:grid-cols-[1.6fr_repeat(3,0.8fr)]">
          <div class="bg-card p-5">
            <p class="eyebrow">로컬 스냅샷</p>
            <h2 id="snapshot-title" class="source-dataset-name mt-2 break-keep text-lg font-semibold">{{ publicDataSnapshot.datasetName }}</h2>
          </div>
          <div class="bg-card p-5"><p class="metric-label">전체 행</p><p class="mt-1 text-xl font-semibold">{{ publicDataSnapshot.rowCount.toLocaleString('ko-KR') }}</p></div>
          <div class="bg-card p-5"><p class="metric-label">필드</p><p class="mt-1 text-xl font-semibold">{{ publicDataSnapshot.columnCount }}</p></div>
          <div class="bg-card p-5"><p class="metric-label">데이터 기준일</p><p class="mt-1 text-sm font-semibold">{{ publicDataSnapshot.dataReferenceDate }}</p></div>
        </div>
        <div class="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground">
          <a class="font-semibold text-primary underline underline-offset-4" :href="publicDataSnapshot.sourceUrl" rel="noopener noreferrer" target="_blank">공공데이터포털 데이터셋 {{ publicDataSnapshot.datasetId }} ↗</a>
          <code class="mt-2 block break-all">SHA-256 {{ publicDataSnapshot.sha256 }}</code>
        </div>
      </section>

      <section class="mt-10" aria-labelledby="unit-price-source-title" data-unit-price-evidence>
        <p class="eyebrow">가격 비교 근거</p>
        <h2 id="unit-price-source-title" class="mt-2 font-brand text-2xl">가격효율·단위가격 비교 출처</h2>
        <p class="mt-3 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">공공데이터포털 스냅샷과 식품안전나라의 신고번호·1일 핵심 함량을 비회원 일반 판매가·필수 배송비와 연결한 비교 근거입니다.</p>
        <p class="mt-3 rounded-lg border border-status-warning/30 bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">공식 사이트가 안정적인 제품별 상세 주소를 제공하지 않는 항목은 데이터셋 또는 제품 검색 화면으로 연결합니다. 카드의 신고번호를 검색해 같은 제품인지 확인하세요.</p>
        <div class="mt-4 space-y-3">
          <details v-for="(group, index) in unitPriceGroups" :key="group.category.slug" class="surface-panel group overflow-hidden" :open="index === 0">
            <summary class="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
              <span>
                <span class="block font-semibold">{{ group.category.name }}</span>
                <span class="mt-1 block text-xs text-muted-foreground">검증 제품 {{ group.products.length }}개</span>
              </span>
              <span class="shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden="true">＋</span>
            </summary>
            <div class="grid gap-3 border-t border-border bg-muted/25 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <article v-for="product in group.products" :key="product.id" class="rounded-xl border border-border bg-card p-5" data-unit-price-evidence-card>
                <div class="flex items-center justify-between gap-3">
                  <span class="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-primary">{{ group.category.name }}</span>
                  <span class="confidence-badge">신뢰도 {{ product.confidence }}</span>
                </div>
                <h3 class="mt-4 break-keep text-sm font-semibold leading-6">{{ product.displayName }}</h3>
                <p class="mt-2 text-xs leading-5 text-muted-foreground">신고번호 {{ product.reportNo }} · 1일 {{ formatUnitPriceAmount(product.dailyActiveAmount, product.activeUnit) }}</p>
                <p class="mt-1 text-xs text-muted-foreground">가격 확인 {{ product.offer.capturedAt }} · 비제휴</p>
                <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <a class="touch-target inline-flex items-center text-primary" :href="product.officialSourceUrl" target="_blank" rel="noopener noreferrer">신고번호 검색 ↗</a>
                  <a class="touch-target inline-flex items-center text-primary" :href="product.offer.url" target="_blank" rel="noopener noreferrer">가격 원문 ↗</a>
                </div>
              </article>
            </div>
          </details>
        </div>
      </section>

      <section class="mt-10" aria-labelledby="reference-title">
        <p class="eyebrow">공통 기준</p>
        <h2 id="reference-title" class="mt-2 font-brand text-2xl">공통 기준 출처</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SourceCard v-for="source in generalSources" :key="source.id" :source="source" />
        </div>
      </section>

      <section class="mt-10" aria-labelledby="product-source-title">
        <p class="eyebrow">제품별 근거</p>
        <h2 id="product-source-title" class="mt-2 font-brand text-2xl">제품별 출처</h2>
        <div class="mt-4 space-y-3">
          <details v-for="group in productGroups" :key="group.product.id" class="surface-panel group overflow-hidden">
            <summary class="touch-target flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold">{{ group.product.officialName }}</span>
                <span class="mt-1 block text-[11px] text-muted-foreground">신고번호 {{ group.product.reportNo }} · 출처 {{ group.sources.length }}개</span>
              </span>
              <span class="shrink-0 text-primary group-open:rotate-45" aria-hidden="true">＋</span>
            </summary>
            <div class="grid gap-3 border-t border-border bg-muted/25 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <SourceCard v-for="source in group.sources" :key="source.id" :source="source" />
            </div>
          </details>
        </div>
      </section>
    </main>
  </div>
</template>
