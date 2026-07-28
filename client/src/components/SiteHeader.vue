<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";

const route = useRoute();
const navigationItems: readonly PrimaryNavigationItem[] = [
  { key: "home", label: "비교 홈", to: "/", href: "/nutri" },
  { key: "categories", label: "종류 찾기", to: "/categories" },
  { key: "ranking", label: "가격 순위", to: "/", href: "/nutri#ranking" },
  { key: "methodology", label: "산정 기준", to: "/methodology" },
];

const activeItem = computed(() => {
  if (route.path.startsWith("/categories")) return navigationItems[1];
  if (route.path === "/" && route.hash === "#ranking") return navigationItems[2];
  if (route.path === "/") return navigationItems[0];
  if (route.path === "/methodology") return navigationItems[3];
  return undefined;
});
</script>

<template>
  <header class="border-b border-border bg-background">
    <div class="site-header__bar container flex min-h-16 items-center px-3 sm:px-4">
      <a class="site-logo touch-target inline-flex items-center gap-2.5 font-brand text-lg" href="/nutri">
        <!-- same mark as favicon.svg -->
        <svg class="h-9 w-9 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="18" fill="#4d7c0f" />
          <path d="M18 19h9l5 10 5-10h9L36 37v10h-8V37L18 19Z" fill="#fffdf5" />
          <circle cx="47" cy="16" r="5" fill="#d9f99d" />
        </svg>
        <span>영양만점</span>
      </a>
    </div>
  </header>
  <ShPrimaryNavigation
    :items="navigationItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    :mobile-columns="2"
    aria-label="영양만점 주요 메뉴"
  />
</template>
