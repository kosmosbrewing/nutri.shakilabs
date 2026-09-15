<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import SiteFooter from "@/components/SiteFooter.vue";
import ConsentBanner from "@/components/policy/ConsentBanner.vue";

// BL-UX-008: Tailwind 유틸(class="pb-[var(--consent-bar-height)]")은
// @shakilabs/ui의 `.sh-surface--pad-none{padding:0}`와 동일 특이도라 소스 순서상
// 패키지 CSS(main.css 이후 로드)에 진다 — 인라인 스타일로 특이도를 올려 확실히 이긴다 (Why).
const bodyPaddingStyle = {
  paddingBottom: "var(--consent-bar-height)",
  transition: "padding-bottom 150ms ease-out",
};
</script>

<template>
  <ShSurface
    as="div"
    variant="plain"
    padding="none"
    class="design-system-shell min-h-screen"
    :style="bodyPaddingStyle"
  >
    <ConsentBanner />
    <RouterView />
    <SiteFooter />
  </ShSurface>
</template>
