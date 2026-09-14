<script setup lang="ts">
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
</script>

<template>
  <!-- v3 section 6.8: fixed bottom bar, occludes less than 30vh, 2 buttons.
       Consent gate logic (useConsent) is unchanged; only position moved to bottom-fixed.
       Plain <section>, not ShSurface. @shakilabs/ui ships after main.css and its `.sh-surface--plain`
       sets `background: transparent` at the same specificity as `bg-foreground`,
       so the utility loses on source order and the dark bar never paints. Only the
       children keep `text-background`, which left light text on the light page
       background at a measured 1.00:1. ShSurface adds nothing else here. -->
  <section
    v-if="ready && decision === null"
    aria-labelledby="analytics-consent-title"
    aria-live="polite"
    class="consent-bar fixed inset-x-0 bottom-0 z-[90] max-h-[30vh] overflow-y-auto border-t border-primary/30 bg-foreground text-background"
    role="region"
  >
    <div class="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h2 id="analytics-consent-title" class="text-sm font-semibold">선택적 이용 분석</h2>
        <p class="mt-1 text-xs leading-5 text-background/80">
          동의한 경우에만 페이지·필터·비교 이용 이벤트를 수집합니다. 건강정보, 검색어 원문, 예산 원값과 개인 식별정보는 전송하지 않습니다.
          <RouterLink class="ml-1 font-semibold text-background underline underline-offset-4" to="/privacy">개인정보 처리 안내</RouterLink>
        </p>
      </div>
      <div class="consent-actions flex shrink-0 justify-end gap-2">
        <button class="touch-target rounded-lg border border-background/40 px-4 text-sm font-semibold hover:bg-background/10" type="button" @click="decide('rejected')">
          거부
        </button>
        <button class="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="button" @click="decide('accepted')">
          동의
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 30vh 상한은 Tailwind 임의값(max-h-[30vh])으로 이미 적용된다 — 내용이 많아도
   바 자체가 화면의 30%를 초과하지 않도록 내부 스크롤로 흡수한다. */
.consent-bar {
  box-shadow: 0 -8px 24px -16px rgb(0 0 0 / 45%);
}
</style>
