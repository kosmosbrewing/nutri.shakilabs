<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import SiteFooter from "@/components/SiteFooter.vue";
import ConsentBanner from "@/components/policy/ConsentBanner.vue";
</script>

<template>
  <ShSurface as="div" variant="plain" padding="none" class="design-system-shell min-h-screen">
    <ConsentBanner />
    <RouterView />
    <SiteFooter />
  </ShSurface>
</template>
