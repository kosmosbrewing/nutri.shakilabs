<script setup lang="ts">
import type { RankingFilterKey, RankingFilters } from "@/utils/ranking";

defineProps<{
  filters: RankingFilters;
  brands: string[];
  resultCount: number;
  totalCount: number;
}>();

const emit = defineEmits<{
  update: [key: RankingFilterKey, value: unknown];
  reset: [];
}>();

function updateFromControl(key: RankingFilterKey, event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  emit("update", key, target.value);
}
</script>

<template>
  <section aria-label="랭킹 필터" class="surface-panel overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
      <div>
        <p class="text-sm font-semibold">비교 조건</p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          전체 {{ totalCount }}개 중 {{ resultCount }}개 표시
        </p>
      </div>
      <button
        class="touch-target rounded-lg px-3 text-sm font-semibold text-primary hover:bg-accent"
        type="button"
        @click="emit('reset')"
      >
        조건 초기화
      </button>
    </div>

    <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      <label class="block min-w-0">
        <span class="filter-label">제품 검색</span>
        <input
          :value="filters.query"
          aria-label="제품 또는 브랜드 검색"
          class="filter-control"
          maxlength="80"
          placeholder="예: 센트룸, 베로카"
          type="search"
          @input="updateFromControl('query', $event)"
        />
      </label>

      <label class="block min-w-0">
        <span class="filter-label">브랜드</span>
        <select
          :value="filters.brand"
          class="filter-control"
          @change="updateFromControl('brand', $event)"
        >
          <option value="all">전체 브랜드</option>
          <option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option>
        </select>
      </label>

      <label class="block min-w-0">
        <span class="filter-label">월 예상 비용</span>
        <select
          :value="filters.budget"
          class="filter-control"
          @change="updateFromControl('budget', $event)"
        >
          <option value="all">예산 전체</option>
          <option value="under-10000">1만원 이하</option>
          <option value="under-15000">1만 5천원 이하</option>
          <option value="under-20000">2만원 이하</option>
        </select>
      </label>

      <label class="block min-w-0">
        <span class="filter-label">정렬</span>
        <select
          :value="filters.sort"
          class="filter-control"
          @change="updateFromControl('sort', $event)"
        >
          <option value="value">가격효율 높은 순</option>
          <option value="coverage">영양충족도 높은 순</option>
          <option value="cost">1일 비용 낮은 순</option>
        </select>
      </label>
    </div>

    <div class="border-t border-border/60 bg-muted/35 px-4 py-3 sm:px-5">
      <label class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <span class="relative grid h-11 w-11 shrink-0 place-items-center">
          <input
            :checked="filters.confidence === 'A'"
            class="peer absolute inset-0 h-11 w-11 cursor-pointer opacity-0"
            type="checkbox"
            @change="emit('update', 'confidence', filters.confidence === 'A' ? 'all' : 'A')"
          />
          <span
            aria-hidden="true"
            class="grid h-5 w-5 place-items-center rounded border border-border text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2"
          >
            <span class="h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-current" />
          </span>
        </span>
        <span>제조사 라벨 근거가 있는 신뢰도 A만 보기</span>
      </label>
    </div>
  </section>
</template>
