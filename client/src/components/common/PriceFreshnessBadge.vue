<script setup lang="ts">
import { computed } from "vue";
import { priceFreshnessBadgeLabels, priceFreshnessBadgeTitle } from "@/data/price-freshness";
import type { PriceFreshness } from "@/utils/scoring";

// Rendered next to every published price. The badge is always present, including the
// "fresh" case, so the build gate can assert one badge per price instead of guessing
// whether a missing badge means "fresh" or "the component was dropped".
const props = defineProps<{ freshness: PriceFreshness; ageDays: number }>();

const label = computed(() => priceFreshnessBadgeLabels[props.freshness]);
const title = computed(() => priceFreshnessBadgeTitle(props.ageDays));
const tone = computed(() => (props.freshness === "fresh"
  ? "border-primary/20 bg-accent text-accent-foreground"
  : "border-status-warning/45 bg-card text-status-warning"));
</script>

<template>
  <span
    class="price-freshness-badge inline-flex w-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
    :class="tone"
    :data-price-freshness="freshness"
    :data-price-age-days="ageDays"
    :title="title"
  >{{ label }}</span>
</template>
