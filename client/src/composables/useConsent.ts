import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  consentDecisionSchema,
  disableAnalytics,
  initializeAnalytics,
  readAnalyticsConsent,
  trackAnalytics,
  writeAnalyticsConsent,
} from "@/utils/analytics";

const decision = ref<"accepted" | "rejected" | null>(null);
const ready = ref(false);

export function useConsent() {
  const route = useRoute();

  onMounted(() => {
    if (ready.value) return;
    decision.value = readAnalyticsConsent();
    ready.value = true;
    if (decision.value === "accepted") {
      initializeAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);
    }
  });

  function decide(input: unknown): boolean {
    const parsed = consentDecisionSchema.safeParse(input);
    if (!parsed.success || !writeAnalyticsConsent(parsed.data)) return false;
    decision.value = parsed.data;
    if (parsed.data === "accepted") {
      if (initializeAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID)) {
        trackAnalytics({ name: "page_view", route: route.path });
      }
    } else {
      disableAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);
    }
    return true;
  }

  return { decide, decision, ready };
}
