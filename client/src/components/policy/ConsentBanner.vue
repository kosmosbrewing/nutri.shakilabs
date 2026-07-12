<script setup lang="ts">
import { ShSurface } from "@shakilabs/ui";
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
</script>

<template>
  <ShSurface
    v-if="ready && decision === null"
    as="section"
    variant="plain"
    padding="none"
    aria-labelledby="analytics-consent-title"
    aria-live="polite"
    class="border-b border-primary/30 bg-foreground text-background"
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
  </ShSurface>
</template>
