<script setup lang="ts">
import { computed } from "vue";
import { priceFreshnessNoticeBody, priceFreshnessNoticeTitles } from "@/data/price-freshness";
import type { PriceFreshness } from "@/utils/scoring";

// Section-level warning shown above a ranking whose weakest price is past the published
// review window. Nothing renders while every price is fresh.
const props = defineProps<{ freshness: PriceFreshness; ageDays: number }>();

const notice = computed(() => {
  if (props.freshness === "fresh") return null;
  return {
    state: props.freshness,
    title: priceFreshnessNoticeTitles[props.freshness],
    body: priceFreshnessNoticeBody(props.freshness, props.ageDays),
  };
});
</script>

<template>
  <div
    v-if="notice"
    class="rounded-xl border border-status-warning/45 bg-card px-5 py-4 text-sm leading-6"
    :data-price-freshness-notice="notice.state"
  >
    <strong class="font-semibold text-status-warning">{{ notice.title }}</strong>
    <p class="mt-1 break-keep text-muted-foreground">{{ notice.body }}</p>
  </div>
</template>
