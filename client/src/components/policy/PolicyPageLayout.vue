<script setup lang="ts">
import SiteHeader from "@/components/SiteHeader.vue";

defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="min-h-screen">
    <SiteHeader />
    <main class="container max-w-3xl py-8 sm:py-12">
      <nav aria-label="현재 위치" class="text-xs text-muted-foreground">
        <a class="touch-target inline-flex items-center font-semibold text-primary" href="/nutri">영양만점</a>
        <span class="mx-2" aria-hidden="true">/</span><span>{{ title }}</span>
      </nav>
      <header class="mt-5">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 class="mt-3 break-keep font-brand text-3xl leading-tight sm:text-4xl">{{ title }}</h1>
        <p class="mt-5 break-keep text-base leading-7 text-muted-foreground">{{ description }}</p>
        <p class="mt-3 text-xs text-muted-foreground">시행·최종 갱신: 2026-07-10</p>
      </header>
      <article class="policy-copy mt-10 surface-panel p-5 sm:p-7">
        <slot />
      </article>
    </main>
  </div>
</template>

<style scoped>
.policy-copy :deep(h2) { @apply mt-8 text-lg font-semibold first:mt-0; }
.policy-copy :deep(p) { @apply mt-3 text-sm leading-7 text-muted-foreground; }
.policy-copy :deep(ul) { @apply mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground; }
.policy-copy :deep(strong) { @apply text-foreground; }
.policy-copy :deep(a) { @apply font-semibold text-primary underline underline-offset-4; }
</style>
