<script setup lang="ts">
import { ShText } from "@shakilabs/ui";
</script>

<template>
  <header class="border-b border-border/70 bg-background">
    <div class="container flex min-h-16 items-center justify-between gap-4">
      <a class="touch-target inline-flex items-center gap-2.5 font-brand text-lg" href="/nutri">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
          영
        </span>
        <ShText as="span" variant="heading">영양만점</ShText>
      </a>
      <nav aria-label="주요 메뉴" class="flex items-center gap-1 sm:gap-3">
        <RouterLink class="touch-target inline-flex items-center px-2 text-sm font-semibold hover:text-primary" to="/categories">종류 찾기</RouterLink>
        <a class="touch-target hidden items-center px-2 text-sm font-semibold hover:text-primary sm:inline-flex" href="/nutri#ranking">가격 순위</a>
        <RouterLink class="touch-target hidden items-center px-2 text-sm font-semibold hover:text-primary sm:inline-flex" to="/methodology">
          산정 기준
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
