import { onMounted, ref } from "vue";
import {
  parseRecentIds,
  pushRecentId,
  RECENT_PRODUCTS_KEY,
} from "@/utils/recent-products";

// SSR-safe: reads localStorage only after mount, so server HTML stays identical for every visitor.
export function useRecentProducts(validIds: readonly string[]) {
  const recentIds = ref<string[]>([]);

  function read(): string[] {
    try {
      return parseRecentIds(localStorage.getItem(RECENT_PRODUCTS_KEY), validIds);
    } catch {
      return [];
    }
  }

  onMounted(() => {
    recentIds.value = read();
  });

  function recordVisit(productId: string): void {
    if (typeof window === "undefined" || !validIds.includes(productId)) return;
    try {
      const next = pushRecentId(read(), productId);
      localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(next));
      recentIds.value = next;
    } catch {
      // Private-mode storage failures must never break the page.
    }
  }

  return { recentIds, recordVisit };
}
