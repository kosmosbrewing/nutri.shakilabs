<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";
import { unitPriceDataset } from "@/utils/unit-price";
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main class="container py-8 sm:py-12">
      <nav aria-label="현재 위치" class="text-xs text-muted-foreground">
        <a class="touch-target inline-flex items-center font-semibold text-primary" href="/nutri">영양만점</a>
        <span class="mx-2" aria-hidden="true">/</span><span>산정 방법</span>
      </nav>

      <header class="mt-5 max-w-3xl">
        <p class="eyebrow">Value-v1 + category-value-v1 methodology</p>
        <h1 class="mt-3 break-keep font-brand text-3xl leading-tight sm:text-4xl">가격당 영양효율은 이렇게 계산합니다</h1>
        <p class="mt-5 break-keep text-base leading-7 text-muted-foreground">
          함량이 많을수록 무조건 높은 점수를 받지 않도록 영양소별 충족률을 100%에서 멈춘 뒤, 배송비를 포함한 하루 비용으로 나눕니다.
        </p>
        <div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span class="trust-chip">산식 버전 value-v1</span>
          <span class="trust-chip">카테고리 효율 category-value-v1</span>
          <span class="trust-chip">단위가격 unit-price-v1</span>
          <span class="trust-chip">일반 성인 기준</span>
          <span class="trust-chip">대상 영양소 23개</span>
        </div>
      </header>

      <section class="mt-10" aria-labelledby="formula-title">
        <h2 id="formula-title" class="font-brand text-2xl">계산 순서</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <article class="formula-card">
            <span class="method-number">01</span><h3 class="mt-2 font-semibold">1일 함량으로 통일</h3>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">1회 함량 × 하루 섭취 횟수로 영양소별 1일 함량을 계산합니다.</p>
          </article>
          <article class="formula-card">
            <span class="method-number">02</span><h3 class="mt-2 font-semibold">충족률은 100% 상한</h3>
            <p class="formula-text">min(1일 함량 ÷ 식약처 기준치, 1)</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">특정 고함량 성분 하나가 전체 순위를 과도하게 올리지 못합니다.</p>
          </article>
          <article class="formula-card">
            <span class="method-number">03</span><h3 class="mt-2 font-semibold">영양충족도 산출</h3>
            <p class="formula-text">23개 충족률의 평균 × 100</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">모든 영양소에 동일 가중치를 적용하는 균형형 기준입니다.</p>
          </article>
          <article class="formula-card">
            <span class="method-number">04</span><h3 class="mt-2 font-semibold">가격효율지수 산출</h3>
            <p class="formula-text">100 × 영양충족도 ÷ 1일 비용</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">1일 비용은 (판매가 + 필수 배송비) ÷ 총 복용일수입니다.</p>
          </article>
        </div>
      </section>

      <section class="mt-10 surface-panel p-5 sm:p-6" aria-labelledby="unit-price-title" data-unit-price-method data-category-value-method>
        <p class="eyebrow">Category price efficiency</p>
        <h2 id="unit-price-title" class="mt-2 font-brand text-2xl">단일 핵심 성분은 단위가격과 가격효율지수로 비교합니다</h2>
        <p class="mt-3 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">비타민·미네랄과 프로바이오틱스, 오메가3, 기능성 원료는 멀티비타민 종합점수와 섞지 않고 같은 카테고리 안에서만 비교합니다. 세트 전체 가격과 필수 배송비를 총 복용일수로 나눈 뒤 공식 핵심 함량의 기준 단위로 환산합니다.</p>
        <p class="formula-text mt-4">단위가격 = 1일 비용 ÷ (1일 핵심 함량 ÷ 기준 함량)</p>
        <p class="formula-text mt-2">가격효율지수 = (현재 비교군 최저 단위가격 ÷ 제품 단위가격) × 100</p>
        <p class="mt-3 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">100점은 현재 같은 카테고리 비교군에서 단위가격이 가장 낮다는 상대값입니다. 가격이 바뀌면 다시 계산되며, 카테고리가 다른 제품의 점수끼리는 비교할 수 없습니다.</p>
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="category in unitPriceDataset.categories" :key="category.slug" class="rounded-lg bg-accent/55 p-4">
            <dt class="font-semibold">{{ category.name }}</dt>
            <dd class="mt-1 text-muted-foreground">{{ category.basisLabel }}</dd>
          </div>
        </dl>
      </section>

      <section class="mt-10 grid gap-5 lg:grid-cols-2">
        <article class="surface-panel p-5 sm:p-6">
          <p class="eyebrow">Missing data</p>
          <h2 class="mt-2 text-xl font-semibold">미표시와 미확인은 다릅니다</h2>
          <dl class="mt-4 space-y-4 text-sm leading-6">
            <div><dt class="font-semibold">전체 라벨 미표시</dt><dd class="text-muted-foreground">확보한 전체 성분표에 항목이 없음을 확인한 상태입니다. 실제 화학적 부재를 단정하지 않으며 value-v1에서는 0점으로 반영합니다.</dd></div>
            <div><dt class="font-semibold">미확인</dt><dd class="text-muted-foreground">라벨 일부만 확보됐거나 판독할 수 없는 상태입니다. 0으로 바꾸지 않고 제품 전체를 랭킹에서 제외합니다.</dd></div>
          </dl>
        </article>

        <article class="surface-panel p-5 sm:p-6">
          <p class="eyebrow">Price freshness</p>
          <h2 class="mt-2 text-xl font-semibold">가격 갱신 규칙</h2>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li><strong class="text-foreground">0~14일:</strong> 최신 가격으로 표시합니다.</li>
            <li><strong class="text-foreground">15~30일:</strong> 갱신 필요 배지를 표시하되 계산은 유지합니다.</li>
            <li><strong class="text-foreground">31일 이상:</strong> 가격이 오래된 제품은 순위 계산에서 제외합니다.</li>
            <li>필수 배송비와 묶음 수량을 포함하며 쿠폰·회원가·카드 할인은 제외합니다.</li>
          </ul>
        </article>
      </section>

      <section class="mt-10 surface-panel overflow-hidden" aria-labelledby="confidence-title">
        <div class="border-b border-border p-5 sm:p-6">
          <p class="eyebrow">Confidence</p>
          <h2 id="confidence-title" class="mt-2 text-xl font-semibold">근거 신뢰도</h2>
        </div>
        <dl class="divide-y divide-border text-sm">
          <div class="grid gap-2 p-5 sm:grid-cols-[5rem_1fr]"><dt class="font-semibold text-primary">A</dt><dd class="text-muted-foreground">식품안전나라 공식 상세와 제조사·브랜드 공식 판매 페이지를 함께 확보한 상태</dd></div>
          <div class="grid gap-2 p-5 sm:grid-cols-[5rem_1fr]"><dt class="font-semibold text-primary">B</dt><dd class="text-muted-foreground">공식 제품·함량 상세와 구조화된 가격비교 또는 판매 페이지를 함께 확보한 상태</dd></div>
          <div class="grid gap-2 p-5 sm:grid-cols-[5rem_1fr]"><dt class="font-semibold text-primary">C</dt><dd class="text-muted-foreground">OCR 또는 비정형 일부 자료 의존 상태. 공개 랭킹에서는 제외</dd></div>
        </dl>
      </section>

      <section class="mt-10 rounded-xl border border-status-warning/30 bg-card p-5 sm:p-6">
        <h2 class="text-lg font-semibold">해석 한계</h2>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">가격효율 1위는 개인에게 가장 적합한 제품이라는 뜻이 아닙니다. 흡수율, 원료 형태, 식사, 다른 영양제와의 중복, 질환과 복약 상태를 반영하지 않습니다. 제품 라벨의 섭취 주의사항을 우선 확인하세요.</p>
        <RouterLink class="touch-target mt-4 inline-flex items-center font-semibold text-primary" to="/sources">사용한 출처 전체 보기 →</RouterLink>
      </section>
    </main>
  </div>
</template>
