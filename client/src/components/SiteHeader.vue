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
import { trackAnalytics } from "@/utils/analytics";

interface NutriNavigationItem extends PrimaryNavigationItem {
  matchPaths: readonly string[];
}

const route = useRoute();

// v3 3.2 — GlobalHeader는 로고 / 앱 이름 + 사이트 링크 + 테마 버튼 + ☰만 담는다.
// 0.3.38 "순수 내비게이션"(2026-09-25): 회전 안내(티커)는 정보라 뺐다 — 가격 확인일·순위 성격은
// 각 순위 화면이, 제휴 고지는 AffiliateNotice·푸터가 이미 싣는다. 산정 기준은 탭·☰에 있다.
// 사이트 링크 — 블로그는 포털 소유라 href, 소개는 이 앱 라우트라 RouterLink(to). 모바일에서는 ☰ 안으로 들어간다.
const headerLinks: GlobalHeaderLink[] = [
  { href: "/blog", label: "블로그" },
  { to: "/about", label: "소개" },
];

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
    app="nutri"
    home-href="/"
    brand="ShakiLabs"
    :links="headerLinks"
    :link-component="RouterLink"
    :nav-items="navigationItems"
    :nav-active-key="navActiveKey"
  >
    <template #utility>
      <ThemeToggle />
    </template>
  </ShGlobalHeader>
  <!-- 모바일(<48rem)에서는 패키지가 이 탭 줄을 숨기고 헤더 ☰가 같은 목록을 연다(0.3.38). -->
  <ShPrimaryNavigation
    :items="navigationItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="영양만점 주요 메뉴"
    @select="trackNavigation"
  />
</template>
