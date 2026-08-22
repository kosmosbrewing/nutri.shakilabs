import { computed, onMounted, ref, type ComputedRef } from "vue";
import { PRICE_AS_OF } from "@/data/price-freshness";
import { getPriceAgeDays, getPriceFreshness, type PriceFreshness } from "@/utils/scoring";

export interface PriceFreshnessState {
  freshness: PriceFreshness;
  ageDays: number;
}

function localCalendarDate(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Freshness evaluated against the build-time date, escalated to the visitor's own date
 * after hydration.
 *
 * Two properties matter here:
 * 1. The first render uses PRICE_AS_OF, so the static HTML is byte-identical for the same
 *    commit and the build gate can assert on it.
 * 2. The client date only ever moves the state forward (a page built weeks ago cannot keep
 *    claiming the price is fresh), never backward, so the rendered state is always a lower
 *    bound on the real age.
 */
export function usePriceFreshness(): {
  asOf: ComputedRef<string>;
  resolve: (capturedAt: string) => PriceFreshnessState;
} {
  const clientAsOf = ref<string | null>(null);

  onMounted(() => {
    const today = localCalendarDate(new Date());
    if (today > PRICE_AS_OF) clientAsOf.value = today;
  });

  const asOf = computed(() => clientAsOf.value ?? PRICE_AS_OF);

  function resolve(capturedAt: string): PriceFreshnessState {
    return {
      freshness: getPriceFreshness(capturedAt, asOf.value),
      ageDays: getPriceAgeDays(capturedAt, asOf.value),
    };
  }

  return { asOf, resolve };
}
