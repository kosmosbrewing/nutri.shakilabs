<script setup lang="ts">
import type { ComparisonEntry } from "@/utils/comparison";
import type { SourceType } from "@/data/types";
import { trackAnalytics } from "@/utils/analytics";

defineProps<{ entries: ComparisonEntry[] }>();

function trackSourceOpen(sourceType: SourceType): void {
  trackAnalytics({ name: "source_open", source_type: sourceType });
}
</script>

<template>
  <section class="mt-8" aria-labelledby="comparison-sources-title">
    <div class="flex items-end justify-between gap-3">
      <div>
        <p class="eyebrow">비교 근거</p>
        <h2 id="comparison-sources-title" class="mt-2 font-brand text-2xl">비교 근거</h2>
      </div>
      <p class="text-xs text-muted-foreground">모든 링크는 비제휴 원문입니다.</p>
    </div>
    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <article v-for="entry in entries" :key="entry.item.product.id" class="surface-panel p-4">
        <h3 class="break-keep text-sm font-semibold">{{ entry.item.product.officialName }}</h3>
        <ul class="mt-3 space-y-2">
          <li v-for="source in entry.sources" :key="source.id" class="text-xs leading-5">
            <a class="touch-target inline-flex items-center font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary" :href="source.url" rel="noopener noreferrer" target="_blank" @click="trackSourceOpen(source.type)">
              {{ source.title }}
            </a>
            <span class="ml-1 text-muted-foreground">· {{ source.verifiedAt }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
