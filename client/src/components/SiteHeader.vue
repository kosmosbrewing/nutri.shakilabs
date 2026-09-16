<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShGlobalHeader,
  ShPrimaryNavigation,
  type GlobalHeaderLink,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";
import ThemeToggle from "@/components/layout/ThemeToggle.vue";
import TickerBar from "@/components/common/TickerBar.vue";
import { trackAnalytics } from "@/utils/analytics";
import { formatUnitPriceWon, resolveUnitPriceRanking, unitPriceDataset } from "@/utils/unit-price";
import { siteLinkNoteShort } from "@/data/affiliate-disclosure";

interface NutriNavigationItem extends PrimaryNavigationItem {
  matchPaths: readonly string[];
}

const route = useRoute();

// v3 3.2 — GlobalHeader는 로고 + 사이트 링크 + 테마 버튼을 담는다.
// 카테고리 메뉴는 별도 PrimaryNavigation으로 내린다(BL-005).
const headerLinks: GlobalHeaderLink[] = [{ to: "/methodology", label: "산정 기준" }];

// same grammar as finance AppHeader: rotating fade ticker, now header's own #tip slot (0.3.24)
const totalProducts = unitPriceDataset.categories.reduce((sum, category) => sum + category.products.length, 0);
const globalTickerMessages: readonly string[] = [
  `가격 확인 ${unitPriceDataset.updatedAt.replaceAll("-", ".")} · 검증 제품 ${totalProducts}개`,
  "전 종류 가격효율 순위 · 효능·품질 순위가 아닙니다",
  siteLinkNoteShort,
];

const tickerMessages = computed<readonly string[]>(() => {
  const match = /^\/categories\/([a-z0-9-]+)$/.exec(route.path);
  if (match) {
    const ranking = resolveUnitPriceRanking(match[1]);
    const top = ranking?.scores[0];
    if (ranking && top) {
      return [
        `${ranking.category.name} 가격효율 1위 ${top.product.displayName} · 1일 ${formatUnitPriceWon(top.dailyCostKrw)}`,
        ...globalTickerMessages,
      ];
    }
  }
  return globalTickerMessages;
});

// same grammar as finance: nav = direct ranking tabs + catalog hub + methodology
const navigationItems: readonly NutriNavigationItem[] = [
  { key: "multivitamin", label: "멀티비타민", to: "/", href: "/nutri#ranking", matchPaths: ["/"] },
  { key: "vitamin-d", label: "비타민D", to: "/categories/vitamin-d", matchPaths: ["/categories/vitamin-d"] },
  { key: "vitamin-c", label: "비타민C", to: "/categories/vitamin-c", matchPaths: ["/categories/vitamin-c"] },
  { key: "probiotics", label: "유산균", to: "/categories/probiotics", matchPaths: ["/categories/probiotics"] },
  { key: "omega-3", label: "오메가3", to: "/categories/omega-3", matchPaths: ["/categories/omega-3"] },
  { key: "magnesium", label: "마그네슘", to: "/categories/magnesium", matchPaths: ["/categories/magnesium"] },
  { key: "calcium", label: "칼슘", to: "/categories/calcium", matchPaths: ["/categories/calcium"] },
  { key: "categories", label: "전체 종류", to: "/categories", matchPaths: ["/categories"] },
  { key: "methodology", label: "산정 기준", to: "/methodology", matchPaths: ["/methodology"] },
];

function isActive(item: NutriNavigationItem): boolean {
  // exact match only for "/" and "/categories" so child category tabs stay exclusive
  if (item.key === "multivitamin" || item.key === "categories") {
    return item.matchPaths.includes(route.path);
  }
  return item.matchPaths.some(
    (path) => route.path === path || route.path.startsWith(`${path}/`),
  );
}

const activeItem = computed(() => navigationItems.find(isActive));
const navActiveKey = computed(() => activeItem.value?.key ?? "");

function trackNavigation(item: PrimaryNavigationItem): void {
  trackAnalytics({ name: "nav_click", to_tool: item.key, placement: "primary_nav" });
}
</script>

<template>
  <ShGlobalHeader
    home-href="/"
    brand="ShakiLabs"
    :links="headerLinks"
    :link-component="RouterLink"
    :nav-items="navigationItems"
    :nav-active-key="navActiveKey"
    nav-title="영양 도구"
  >
    <!-- 한 줄 말줄임 절대 위치라 문구 길이가 56px 헤더 높이에 영향을 주지 않는다(BL-005) -->
    <template #tip>
      <TickerBar :key="route.path" :messages="tickerMessages" />
    </template>

    <template #utility>
      <ThemeToggle />
    </template>
  </ShGlobalHeader>
  <ShPrimaryNavigation
    class="tab-navigation--desktop-only"
    :items="navigationItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="영양만점 주요 메뉴"
    @select="trackNavigation"
  />
</template>

<style scoped>
/* v3 §3.3-1 — 모바일(<48rem)은 헤더의 좌측 드로어가 대신한다.
   링크는 드로어에 그대로 렌더되므로 크롤 경로는 유지된다(레시피 §3). */
@media (max-width: 47.99rem) {
  .tab-navigation--desktop-only {
    display: none;
  }
}
</style>
