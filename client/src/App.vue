<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import SiteFooter from "@/components/SiteFooter.vue";
// 하단 고정 동의 바는 뗐다 — 2026-11-01부터 이용 분석이 옵트아웃이라 바가 하는 일은 "확인" 한 번뿐이었고,
// 390px 첫 화면의 10%를 모든 페이지에서 가렸다. 거부는 /privacy의 '이용 분석 선택'(ConsentSettings)에서 그대로 된다.
</script>

<template>
  <ShSurface as="div" variant="plain" padding="none" class="design-system-shell min-h-screen">
    <RouterView />
    <SiteFooter />
  </ShSurface>
</template>
