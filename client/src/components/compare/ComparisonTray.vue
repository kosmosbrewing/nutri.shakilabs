<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { RankingItem } from "@/utils/ranking";

defineProps<{
  items: RankingItem[];
  canCompare: boolean;
  compareLocation: RouteLocationRaw;
  error: string | null;
}>();

defineEmits<{
  clear: [];
  remove: [productId: string];
}>();
</script>

<template>
  <Transition name="tray-rise">
    <aside v-if="items.length" class="fixed inset-x-3 bottom-3 z-50" aria-live="polite">
      <div class="mx-auto max-w-[1080px] rounded-xl border border-primary/30 bg-foreground p-3 text-background shadow-2xl sm:p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold">비교함 {{ items.length }}/4</p>
            <p class="mt-0.5 truncate text-xs text-background/65">
              {{ error ?? (canCompare ? '선택한 제품의 영양소를 나란히 봅니다.' : '한 개를 더 선택해 주세요.') }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button class="touch-target rounded-lg px-3 text-xs font-semibold text-background/75 hover:bg-background/10" type="button" @click="$emit('clear')">
              비우기
            </button>
            <RouterLink
              v-if="canCompare"
              class="touch-target inline-flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              :to="compareLocation"
            >
              비교하기
            </RouterLink>
            <button v-else class="touch-target inline-flex items-center rounded-lg bg-background/10 px-4 text-sm font-semibold text-background/45" disabled type="button">
              비교하기
            </button>
          </div>
        </div>
        <div class="mt-3 hidden flex-wrap gap-2 sm:flex">
          <button
            v-for="item in items"
            :key="item.product.id"
            class="min-h-11 max-w-56 truncate rounded-full border border-background/20 px-3 text-xs hover:border-background/55"
            type="button"
            :aria-label="`${item.product.officialName} 비교에서 제거`"
            @click="$emit('remove', item.product.id)"
          >
            {{ item.product.officialName }} ×
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.tray-rise-enter-active,
.tray-rise-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.tray-rise-enter-from,
.tray-rise-leave-to { opacity: 0; transform: translateY(12px); }
</style>
