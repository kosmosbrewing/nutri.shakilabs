<script setup lang="ts">
import { ShText } from "@shakilabs/ui";
import { ref } from "vue";

const menuOpen = ref(false);
</script>

<template>
  <header class="relative z-40 border-b border-border/70 bg-background/95 backdrop-blur">
    <div class="site-header__bar container flex min-h-16 items-center justify-between gap-4">
      <a class="site-logo touch-target inline-flex items-center gap-2.5 font-brand text-lg" href="/nutri">
        <span class="site-logo__mark grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
          영
        </span>
        <ShText as="span" variant="heading">영양만점</ShText>
      </a>
      <nav aria-label="주요 메뉴" class="hidden items-center gap-3 sm:flex">
        <RouterLink class="touch-target inline-flex items-center px-2 text-sm font-semibold hover:text-primary" to="/categories">종류 찾기</RouterLink>
        <a class="touch-target inline-flex items-center px-2 text-sm font-semibold hover:text-primary" href="/nutri#ranking">가격 순위</a>
        <RouterLink class="touch-target inline-flex items-center px-2 text-sm font-semibold hover:text-primary" to="/methodology">
          산정 기준
        </RouterLink>
      </nav>
      <button
        class="site-menu-button touch-target grid place-items-center rounded-lg border border-border sm:hidden"
        type="button"
        aria-controls="nutri-mobile-menu"
        :aria-expanded="menuOpen"
        aria-label="메뉴 열기"
        @click="menuOpen = !menuOpen"
      >
        <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-width="2" :d="menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'" />
        </svg>
      </button>
    </div>
    <nav
      v-if="menuOpen"
      id="nutri-mobile-menu"
      aria-label="모바일 메뉴"
      class="absolute inset-x-0 top-full border-b border-border bg-background p-3 shadow-lift sm:hidden"
    >
      <RouterLink class="touch-target flex items-center rounded-lg px-3 text-sm font-semibold hover:bg-accent" to="/categories" @click="menuOpen = false">종류 찾기</RouterLink>
      <a class="touch-target flex items-center rounded-lg px-3 text-sm font-semibold hover:bg-accent" href="/nutri#ranking" @click="menuOpen = false">가격 순위</a>
      <RouterLink class="touch-target flex items-center rounded-lg px-3 text-sm font-semibold hover:bg-accent" to="/methodology" @click="menuOpen = false">산정 기준</RouterLink>
    </nav>
  </header>
</template>
