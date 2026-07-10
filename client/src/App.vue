<script setup lang="ts">
import SiteFooter from "@/components/SiteFooter.vue";
import ConsentBanner from "@/components/policy/ConsentBanner.vue";
</script>

<template>
  <RouterView />
  <SiteFooter />
  <ConsentBanner />
</template>
