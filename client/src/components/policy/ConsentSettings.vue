<script setup lang="ts">
import { computed } from "vue";
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
  <section class="mt-5 rounded-xl border border-border bg-muted/35 p-4" aria-labelledby="consent-settings-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 id="consent-settings-title" class="text-sm font-semibold">이용 분석 선택</h3>
        <p class="mt-1 text-xs text-muted-foreground" aria-live="polite">현재 상태: {{ status }}</p>
      </div>
      <div class="flex gap-2">
        <button class="touch-target rounded-lg border border-border px-3 text-xs font-semibold hover:border-primary" type="button" @click="decide('rejected')">거부</button>
        <button class="touch-target rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground" type="button" @click="decide('accepted')">허용</button>
      </div>
    </div>
  </section>
</template>
