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
    // 2026-11-01 옵트아웃으로 전환: 수락 전에는 로드하지 않던 탓에 네이버 기준 월 100클릭 이상인 nutri가 GA4에는
    // 1조회로 잡혔다(다른 11개 앱은 동의 없이 로드). 거부를 고르면 즉시 끄고 이후 로드하지 않는 것은 그대로다.
    if (decision.value !== "rejected") {
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
