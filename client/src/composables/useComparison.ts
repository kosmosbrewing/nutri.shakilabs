import { computed, ref } from "vue";
import { z } from "zod";
import type { RankingItem } from "@/utils/ranking";
import { MAX_COMPARE_COUNT } from "@/utils/comparison";

export function useComparison(items: RankingItem[]) {
  const selectedIds = ref<string[]>([]);
  const selectionError = ref<string | null>(null);
  const validIds = new Set(items.map((item) => item.product.id));
  const idSchema = z.string().refine((id) => validIds.has(id));

  const selectedItems = computed(() => selectedIds.value
    .map((id) => items.find((item) => item.product.id === id))
    .filter((item): item is RankingItem => Boolean(item)));
  const canCompare = computed(() => selectedIds.value.length >= 2);
  const isLimitReached = computed(() => selectedIds.value.length >= MAX_COMPARE_COUNT);
  const compareLocation = computed(() => ({
    name: "Compare",
    query: { ids: selectedIds.value.join(",") },
  }));

  function isSelected(productId: string): boolean {
    return selectedIds.value.includes(productId);
  }

  function toggleProduct(input: unknown): boolean {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return false;
    selectionError.value = null;
    if (isSelected(parsed.data)) {
      selectedIds.value = selectedIds.value.filter((id) => id !== parsed.data);
      return true;
    }
    if (isLimitReached.value) {
      selectionError.value = "비교는 최대 4개까지 가능합니다.";
      return false;
    }
    selectedIds.value = [...selectedIds.value, parsed.data];
    return true;
  }

  function clearSelection(): void {
    selectedIds.value = [];
    selectionError.value = null;
  }

  return {
    canCompare,
    clearSelection,
    compareLocation,
    isLimitReached,
    isSelected,
    selectedIds,
    selectedItems,
    selectionError,
    toggleProduct,
  };
}
