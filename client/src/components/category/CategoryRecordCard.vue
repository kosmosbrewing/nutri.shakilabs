<script setup lang="ts">
import { formatActiveAmount } from "@/utils/category-catalog";
import type { CategoryCatalogEntry, CategoryCatalogRecord } from "@/utils/category-catalog";

defineProps<{
  category: CategoryCatalogEntry;
  record: CategoryCatalogRecord;
}>();
</script>

<template>
  <article class="rounded-xl border border-border bg-card p-5" data-official-record>
    <div class="flex flex-wrap items-start justify-between gap-2">
      <span class="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
        공식 등록 예시
      </span>
      <time class="text-[11px] text-muted-foreground" :datetime="record.dataCreatedAt">
        생성 {{ record.dataCreatedAt.replaceAll("-", ".") }}
      </time>
    </div>
    <h2 class="mt-4 break-keep font-semibold leading-6">{{ record.name }}</h2>
    <dl class="mt-4 grid grid-cols-2 gap-2 text-xs leading-5">
      <div class="col-span-2">
        <dt class="text-muted-foreground">제조사</dt>
        <dd class="break-all font-semibold">{{ record.manufacturer }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">신고번호</dt>
        <dd class="break-words font-semibold">{{ record.reportNo }}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground">섭취 표기</dt>
        <dd class="font-semibold">{{ record.servingSize }} · {{ record.dailyFrequency }}</dd>
      </div>
    </dl>
    <p
      v-if="record.activeAmount !== null && category.activeUnit"
      class="mt-4 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
    >
      공공데이터 제공단위 함량 {{ formatActiveAmount(record.activeAmount, category.activeUnit) }}
    </p>
  </article>
</template>
