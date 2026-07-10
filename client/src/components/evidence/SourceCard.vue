<script setup lang="ts">
import { computed } from "vue";
import type { SourceEvidence } from "@/data/types";
import { trackAnalytics } from "@/utils/analytics";
import { getSourceFieldLabels, getSourceTypeLabel } from "@/utils/evidence";

const props = defineProps<{ source: SourceEvidence }>();
const fields = computed(() => getSourceFieldLabels(props.source.fields).join(" · "));

function trackSourceOpen(): void {
  trackAnalytics({ name: "source_open", source_type: props.source.type });
}
</script>

<template>
  <article class="rounded-xl border border-border bg-card p-4" data-source-card>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="confidence-badge">{{ getSourceTypeLabel(source.type) }}</span>
      <span class="text-[11px] text-muted-foreground">확인 {{ source.verifiedAt }}</span>
    </div>
    <h3 class="mt-3 break-keep text-sm font-semibold leading-6">{{ source.title }}</h3>
    <p class="mt-2 text-xs leading-5 text-muted-foreground">근거 필드: {{ fields }}</p>
    <a class="touch-target mt-3 inline-flex items-center text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-4" :href="source.url" rel="noopener noreferrer" target="_blank" @click="trackSourceOpen">
      원문 열기 ↗
    </a>
    <details class="mt-2 text-[11px] text-muted-foreground">
      <summary class="cursor-pointer py-2">검증 해시</summary>
      <code class="block break-all rounded-lg bg-muted p-2">{{ source.rawHash }}</code>
    </details>
  </article>
</template>
