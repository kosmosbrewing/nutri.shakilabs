import { computed, ref } from "vue";
import { nutriDataset } from "@/data/dataset";
import {
  buildRankingItems,
  DEFAULT_RANKING_FILTERS,
  filterRankingItems,
  rankingFilterSchema,
  type RankingFilterKey,
  type RankingFilters,
} from "@/utils/ranking";
import { validateDataset } from "@/utils/validation";

export function useRanking() {
  const filters = ref<RankingFilters>({ ...DEFAULT_RANKING_FILTERS });
  const datasetResult = validateDataset(nutriDataset);
  const buildResult = datasetResult.success
    ? buildRankingItems(datasetResult.data)
    : { success: false as const, detail: datasetResult.error.message };
  const allItems = buildResult.success ? buildResult.items : [];
  const dataError = buildResult.success ? null : buildResult.detail;

  const brands = [...new Set(allItems.map((item) => item.product.brand))]
    .sort((left, right) => left.localeCompare(right, "ko"));

  const filteredResult = computed(() => filterRankingItems(allItems, filters.value));
  const visibleItems = computed(() => filteredResult.value.success
    ? filteredResult.value.items
    : []);
  const filterError = computed(() => filteredResult.value.success
    ? null
    : filteredResult.value.detail);

  function updateFilter(key: RankingFilterKey, value: unknown): boolean {
    const next = { ...filters.value, [key]: value };
    const parsed = rankingFilterSchema.safeParse(next);
    if (!parsed.success) return false;
    if (parsed.data.brand !== "all" && !brands.includes(parsed.data.brand)) return false;
    filters.value = parsed.data;
    return true;
  }

  function resetFilters(): void {
    filters.value = { ...DEFAULT_RANKING_FILTERS };
  }

  return {
    allItems,
    brands,
    dataError,
    filterError,
    filters,
    resetFilters,
    updateFilter,
    visibleItems,
  };
}
