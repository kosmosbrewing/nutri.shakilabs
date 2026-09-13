<script setup lang="ts">
import { computed } from "vue";
import { COUPANG_DISCLOSURE_SENTENCE } from "@/data/affiliate-disclosure";
import { isAffiliateLink } from "@/utils/affiliate";

// The paid-endorsement disclosure belongs on every screen that actually exposes an affiliate
// link. Showing it on a screen with none would itself be a false statement, so the component
// takes the URLs the screen renders and draws only when at least one of them is affiliate.
const props = defineProps<{ urls: readonly string[] }>();

const visible = computed(() => props.urls.some((url) => isAffiliateLink(url)));
</script>

<template>
  <p
    v-if="visible"
    class="rounded-lg border border-status-warning/30 bg-card px-4 py-3 text-xs leading-5 text-muted-foreground"
    data-affiliate-disclosure
  >
    {{ COUPANG_DISCLOSURE_SENTENCE }}
  </p>
</template>
