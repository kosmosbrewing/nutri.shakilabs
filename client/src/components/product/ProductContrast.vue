<script setup lang="ts">
import { computed } from "vue";
import { buildProductContrast } from "@/utils/product-contrast";
import type { RankingItem } from "@/utils/ranking";

// 상세 페이지 첫머리: 기준치 판정과 가장 비슷한 제품과의 함량 차이. 같은 브랜드 제품끼리
// 공통 틀(23행 표·대안·근거)이 먼저 읽히지 않도록 이 제품에서만 나오는 값을 표보다 위에 둔다.
const props = defineProps<{ item: RankingItem; items: RankingItem[] }>();
const contrast = computed(() => buildProductContrast(props.item, props.items));
</script>

<template>
  <section class="mt-10" aria-labelledby="product-contrast-title" data-product-contrast>
    <p class="eyebrow">What sets it apart</p>
    <h2 id="product-contrast-title" class="mt-2 font-brand text-2xl">이 제품만의 값</h2>
    <div class="mt-4 grid gap-3 lg:grid-cols-2">
      <article class="surface-panel p-5" data-product-verdict>
        <h3 class="break-keep text-base font-semibold leading-snug">{{ contrast.verdict.title }}</h3>
        <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ contrast.verdict.body }}</p>
      </article>
      <article v-if="contrast.closest" class="surface-panel flex flex-col p-5" data-product-closest>
        <h3 class="break-keep text-base font-semibold leading-snug">{{ contrast.closest.title }}</h3>
        <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ contrast.closest.body }}</p>
        <RouterLink
          class="touch-target mt-auto inline-flex items-center pt-2 text-sm font-semibold text-primary"
          :to="{ name: 'Compare', query: { ids: `${item.product.id},${contrast.closest.partner.product.id}` } }"
        >
          두 제품 나란히 비교
        </RouterLink>
      </article>
    </div>
  </section>
</template>
