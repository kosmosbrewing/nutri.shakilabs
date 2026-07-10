<script setup lang="ts">
import { computed } from "vue";
import { ShButton, ShSurface } from "@shakilabs/ui";
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
const status = computed(() => {
  if (!ready.value) return "확인 중";
  if (decision.value === "accepted") return "분석 허용";
  if (decision.value === "rejected") return "분석 거부";
  return "선택 전";
});
</script>

<template>
  <ShSurface as="section" padding="sm" class="mt-5" aria-labelledby="consent-settings-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 id="consent-settings-title" class="text-sm font-semibold">이용 분석 선택</h3>
        <p class="mt-1 text-xs text-muted-foreground" aria-live="polite">현재 상태: {{ status }}</p>
      </div>
      <div class="flex gap-2">
        <ShButton variant="secondary" size="sm" @click="decide('rejected')">거부</ShButton>
        <ShButton size="sm" @click="decide('accepted')">허용</ShButton>
      </div>
    </div>
  </ShSurface>
</template>
