<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";
import TickerBar from "@/components/common/TickerBar.vue";
import { trackAnalytics } from "@/utils/analytics";
import { formatUnitPriceWon, resolveUnitPriceRanking, unitPriceDataset } from "@/utils/unit-price";

interface NutriNavigationItem extends PrimaryNavigationItem {
  matchPaths: readonly string[];
}

const route = useRoute();

// same grammar as finance AppHeader: rotating fade ticker between logo and nav
const totalProducts = unitPriceDataset.categories.reduce((sum, category) => sum + category.products.length, 0);
const globalTickerMessages: readonly string[] = [
  `가격 확인 ${unitPriceDataset.updatedAt.replaceAll("-", ".")} · 검증 제품 ${totalProducts}개`,
  "전 종류 가격효율 순위 · 효능·품질 순위가 아닙니다",
  "모든 가격 링크는 비제휴입니다",
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

const mobileDefaultKeys = [
  "multivitamin",
  "vitamin-c",
  "probiotics",
  "omega-3",
  "categories",
  "methodology",
] as const;

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

const mobileItems = computed(() => {
  const keys: string[] = [...mobileDefaultKeys];
  if (activeItem.value && !keys.includes(activeItem.value.key)) {
    keys[3] = activeItem.value.key;
  }
  return keys
    .map((key) => navigationItems.find((item) => item.key === key))
    .filter((item): item is NutriNavigationItem => Boolean(item));
});

function trackNavigation(item: PrimaryNavigationItem): void {
  trackAnalytics({ name: "nav_click", to_tool: item.key, placement: "primary_nav" });
}
</script>

<template>
  <header class="border-b border-border bg-background">
    <div class="site-header__bar container flex min-h-16 items-center px-3 sm:px-4">
      <a class="site-logo touch-target inline-flex items-center gap-2.5 font-brand text-lg" href="/nutri">
        <!-- nutri product mark; the tab favicon uses the shakilabs common mark -->
        <svg class="h-9 w-9 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="18" fill="#4d7c0f" />
          <path d="M18 19h9l5 10 5-10h9L36 37v10h-8V37L18 19Z" fill="#fffdf5" />
          <circle cx="47" cy="16" r="5" fill="#d9f99d" />
        </svg>
        <span>영양만점</span>
      </a>
      <div class="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-4">
        <TickerBar :key="route.path" :messages="tickerMessages" />
      </div>
    </div>
  </header>
  <ShPrimaryNavigation
    :items="navigationItems"
    :mobile-items="mobileItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    :mobile-columns="2"
    aria-label="영양만점 주요 메뉴"
    @select="trackNavigation"
  />
</template>
