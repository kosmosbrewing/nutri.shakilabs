<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "@/components/SiteHeader.vue";
import ComparisonDesktopTable from "@/components/compare/ComparisonDesktopTable.vue";
import ComparisonMobileCards from "@/components/compare/ComparisonMobileCards.vue";
import ComparisonSources from "@/components/compare/ComparisonSources.vue";
import { useRanking } from "@/composables/useRanking";
import { nutriDataset } from "@/data/dataset";
import { buildComparisonEntries, parseComparisonIds } from "@/utils/comparison";
import { trackAnalytics } from "@/utils/analytics";

const route = useRoute();
const { allItems, dataError } = useRanking();
const validIds = allItems.map((item) => item.product.id);
const defaultComparisonIds = allItems.slice(0, 2).map((item) => item.product.id).join(",");
const parsedIds = computed(() => parseComparisonIds(
  route.query.ids === undefined ? defaultComparisonIds : route.query.ids,
  validIds,
));
const pageError = computed(() => {
  if (dataError) return dataError;
  return parsedIds.value.success ? null : parsedIds.value.detail;
});
const entries = computed(() => parsedIds.value.success
  ? buildComparisonEntries(parsedIds.value.ids, allItems, nutriDataset.sources)
  : []);

onMounted(() => {
  if (entries.value.length >= 2 && entries.value.length <= 4) {
    trackAnalytics({ name: "compare_view", product_count: entries.value.length });
  }
});
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main class="container py-8 sm:py-12">
      <RouterLink class="touch-target inline-flex items-center text-sm font-semibold text-primary" :to="{ path: '/', hash: '#ranking' }">
        ← 순위로 돌아가기
      </RouterLink>

      <header class="mt-5 max-w-3xl">
        <p class="eyebrow">Side by side</p>
        <h1 class="mt-3 break-keep font-brand text-3xl leading-tight sm:text-4xl">멀티비타민 성분·가격 비교</h1>
        <p class="mt-4 break-keep text-base leading-7 text-muted-foreground">
          선택한 제품의 배송비 포함 1일 비용과 23개 영양소 충족률을 같은 기준으로 나란히 표시합니다.
        </p>
      </header>

      <section v-if="pageError" class="surface-panel mt-8 px-5 py-12 text-center" role="alert">
        <p class="font-semibold">비교 목록을 열 수 없습니다.</p>
        <p class="mt-2 text-sm text-muted-foreground">{{ pageError }}</p>
        <RouterLink class="touch-target mt-5 inline-flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" :to="{ path: '/', hash: '#ranking' }">
          제품 선택하기
        </RouterLink>
      </section>

      <template v-else>
        <div class="mt-7 rounded-xl border border-primary/20 bg-accent px-4 py-3 text-xs leading-5 text-accent-foreground">
          비교 제품 {{ entries.length }}개 · 동일한 일반 성인 기준 · 가격 확인일 2026.07.10 · 자체 점수는 사용자 리뷰 평점이 아닙니다.
        </div>
        <div class="mt-5">
          <ComparisonMobileCards :entries="entries" :references="nutriDataset.nutrientReferences" />
          <ComparisonDesktopTable :entries="entries" :references="nutriDataset.nutrientReferences" />
        </div>
        <ComparisonSources :entries="entries" />
      </template>
    </main>

  </div>
</template>
