<script setup lang="ts">
import { ShButton, ShSurface, ShText } from "@shakilabs/ui";
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
</script>

<template>
  <ShSurface
    v-if="ready && decision === null"
    as="section"
    variant="raised"
    padding="md"
    aria-labelledby="analytics-consent-title"
    aria-live="polite"
    class="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl border-primary/30"
    role="dialog"
  >
    <ShText id="analytics-consent-title" as="h2" variant="heading">선택적 이용 분석</ShText>
    <ShText class="mt-2" variant="caption" tone="muted">
      동의한 경우에만 페이지·필터·비교 이용 이벤트를 수집합니다. 건강정보, 검색어 원문, 예산 원값과 개인 식별정보는 전송하지 않습니다.
      <RouterLink class="ml-1 inline-flex min-h-11 items-center align-middle underline underline-offset-4" to="/privacy">개인정보 처리 안내</RouterLink>
    </ShText>
    <div class="mt-4 flex justify-end gap-2">
      <ShButton variant="secondary" @click="decide('rejected')">
        거부
      </ShButton>
      <ShButton @click="decide('accepted')">
        동의
      </ShButton>
    </div>
  </ShSurface>
</template>
