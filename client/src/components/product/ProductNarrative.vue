<script setup lang="ts">
import type { ProductNarrative } from "@/utils/product-narrative";

// 순위 해설 블록. 뷰가 200줄을 넘지 않도록 ProductDetailView에서 떼어 냈다 — 마크업은 그대로다.
defineProps<{ narrative: ProductNarrative }>();
</script>

<template>
  <section class="mt-10 surface-panel p-5 sm:p-7" aria-labelledby="product-narrative-title" data-product-narrative>
    <p class="eyebrow">{{ narrative.eyebrow }}</p>
    <h2 id="product-narrative-title" class="mt-2 break-keep font-brand text-2xl">{{ narrative.heading }}</h2>
    <p
      v-for="paragraph in narrative.paragraphs"
      :key="paragraph"
      class="mt-4 max-w-3xl break-keep text-sm leading-7 text-muted-foreground"
    >{{ paragraph }}</p>

    <h3 class="mt-7 text-sm font-semibold">{{ narrative.factsHeading }}</h3>
    <dl class="mt-3 divide-y divide-border border-y border-border text-sm">
      <div
        v-for="fact in narrative.facts"
        :key="fact.label"
        class="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
      >
        <dt class="text-muted-foreground">{{ fact.label }}</dt>
        <dd class="break-keep leading-6">{{ fact.value }}</dd>
      </div>
    </dl>

    <p class="mt-5 max-w-3xl break-keep pt-1 text-xs leading-6 text-muted-foreground">
      {{ narrative.disclaimer }}
    </p>
  </section>
</template>
