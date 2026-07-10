<script setup lang="ts">
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
</script>

<template>
  <section
    v-if="ready && decision === null"
    aria-labelledby="analytics-consent-title"
    aria-live="polite"
    class="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-xl border border-primary/30 bg-foreground p-4 text-background shadow-2xl sm:p-5"
    role="dialog"
  >
    <h2 id="analytics-consent-title" class="text-sm font-semibold">선택적 이용 분석</h2>
    <p class="mt-2 text-xs leading-5 text-background/70">
      동의한 경우에만 페이지·필터·비교 이용 이벤트를 수집합니다. 건강정보, 검색어 원문, 예산 원값과 개인 식별정보는 전송하지 않습니다.
      <RouterLink class="ml-1 underline underline-offset-4" to="/privacy">개인정보 처리 안내</RouterLink>
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <button class="touch-target rounded-lg border border-background/30 px-4 text-sm font-semibold hover:bg-background/10" type="button" @click="decide('rejected')">
        거부
      </button>
      <button class="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="button" @click="decide('accepted')">
        동의
      </button>
    </div>
  </section>
</template>
