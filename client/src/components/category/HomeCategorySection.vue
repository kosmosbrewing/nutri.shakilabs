<script setup lang="ts">
import CategoryGrid from "./CategoryGrid.vue";
import { categoryCards } from "@/utils/category-catalog";

const featuredCategories = categoryCards.slice(0, 6);
</script>

<template>
  <section id="categories" class="container scroll-mt-4 py-10 sm:py-14">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="eyebrow">Category atlas</p>
        <h2 class="mt-2 break-keep font-brand text-2xl sm:text-3xl">비교할 영양제 종류부터 고르세요</h2>
      </div>
      <a class="touch-target inline-flex items-center text-sm font-semibold text-primary" href="/nutri/categories">
        10개 카테고리 전체 보기 →
      </a>
    </div>
    <CategoryGrid :categories="featuredCategories" />
    <p class="mt-4 break-keep text-xs leading-5 text-muted-foreground">
      공식 목록은 공공데이터의 등록 레코드 탐색이며 추천이나 현재 판매 보장이 아닙니다. 가격·함량 근거가 완성된 멀티비타민만 독립 랭킹을 제공합니다.
    </p>
  </section>
</template>
