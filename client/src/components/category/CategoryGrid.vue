<script setup lang="ts">
import type { CategoryCardItem } from "@/utils/category-catalog";

defineProps<{
  categories: CategoryCardItem[];
}>();

const statusLabel = {
  ranking: "랭킹 제공",
  unit_price: "가격효율 비교",
  official_catalog: "공식 목록",
} as const;

const actionLabel = {
  ranking: "가격효율 보기",
  unit_price: "가격효율 보기",
  official_catalog: "등록 예시 보기",
} as const;
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <a
      v-for="(category, index) in categories"
      :key="category.slug"
      :href="category.href"
      class="group relative min-w-0 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-lift transition duration-200 hover:-translate-y-0.5 hover:border-primary/45"
      :data-category-card="category.slug"
    >
      <div class="flex items-start justify-between gap-3">
        <span class="font-brand text-sm text-primary">{{ String(index + 1).padStart(2, "0") }}</span>
        <span
          class="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          :class="category.status === 'ranking' ? 'bg-primary text-primary-foreground' : category.status === 'unit_price' ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground'"
        >
          {{ statusLabel[category.status] }}
        </span>
      </div>
      <p class="mt-7 text-xs font-semibold text-muted-foreground">
        {{ category.count.toLocaleString("ko-KR") }}개 {{ category.countLabel }}
      </p>
      <h3 class="mt-1 break-keep font-brand text-xl">{{ category.name }}</h3>
      <p class="mt-3 break-keep text-sm leading-6 text-muted-foreground">{{ category.summary }}</p>
      <span class="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
        {{ actionLabel[category.status] }}
        <span class="ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
      </span>
    </a>
  </div>
</template>
