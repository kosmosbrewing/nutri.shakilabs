<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
const visible = computed(() => ready.value && decision.value === null);
// 고지 전문은 접어 두고 한 줄 바만 띄운다 — 두 줄 고지 + 세로로 쌓인 버튼이 iPhone 13 첫 화면의
// 25%(169/664px)를 가렸다(2026-09-27 외부 점검). 전문은 "자세히"로 그 자리에서 펼치고,
// 펼치지 않아도 aria-describedby로 스크린리더에는 전문이 읽힌다.
const expanded = ref(false);

const barEl = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

// BL-UX-008: 패널 실제 높이를 :root 커스텀 프로퍼티로 노출한다.
// App.vue의 본문 wrapper가 이 값을 그대로 padding-bottom으로 예약해 쓴다 —
// 배너 높이와 본문 padding을 하드코딩 px 두 벌로 따로 관리하면 반드시 어긋난다 (Why).
// +1px 여유는 배너와 본문이 서로 다른 레이아웃 트리라 subpixel 반올림이 독립적으로
// 발생해 경계가 0.x px 겹치는 걸 막기 위한 안전 여유다 (실측: 겹침 없음 판정 기준).
const SUBPIXEL_SAFETY_MARGIN_PX = 1;

function setBarHeightVar(px: number) {
  // vite-ssg는 setup()을 서버에서도 실행한다 — SSR에는 document가 없으니
  // 이 watcher(immediate:true)가 서버에서 첫 호출될 때 죽지 않도록 가드한다 (Why).
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--consent-bar-height", `${px}px`);
}

function setBarVisibleHeight(px: number) {
  setBarHeightVar(px + SUBPIXEL_SAFETY_MARGIN_PX);
}

function startObserving(el: HTMLElement) {
  if (resizeObserver || typeof ResizeObserver === "undefined") return;
  // contentRect는 border를 제외한 content-box 높이라 border-t 1px만큼 실제 시각적 높이보다 작다.
  // 겹침 판정은 픽셀 단위라 이 1px 오차가 곧 바로 겹침으로 잡히므로, 시각적 박스 전체를
  // 포함하는 getBoundingClientRect()로 다시 잰다 (Why).
  resizeObserver = new ResizeObserver(() => {
    setBarVisibleHeight(Math.ceil(el.getBoundingClientRect().height));
  });
  resizeObserver.observe(el);
}

function stopObserving() {
  resizeObserver?.disconnect();
  resizeObserver = null;
}

watch(
  visible,
  async (isVisible) => {
    if (!isVisible) {
      // 동의/거부로 배너가 사라지면 예약해둔 padding도 즉시 반납한다 — 빈 여백 방지 (Why).
      stopObserving();
      setBarHeightVar(0);
      return;
    }
    await nextTick();
    if (barEl.value) {
      setBarVisibleHeight(Math.ceil(barEl.value.getBoundingClientRect().height));
      startObserving(barEl.value);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopObserving();
  setBarHeightVar(0);
});
</script>

<template>
  <!-- v3 section 6.8: fixed bottom bar with 2 buttons. Consent gate logic (useConsent) is unchanged —
       same storage key, same decide() calls, nothing loads before "동의".
       Plain <section>, not ShSurface. @shakilabs/ui ships after main.css and its `.sh-surface--plain`
       sets `background: transparent` at the same specificity as `bg-foreground`,
       so the utility loses on source order and the dark bar never paints. Only the
       children keep `text-background`, which left light text on the light page
       background at a measured 1.00:1. ShSurface adds nothing else here.

       한 줄 바: 제목 + 자세히 | 거부·동의. 버튼 줄 높이(44px 터치 타깃) + 위아래 8px이 바 전체라
       390×664에서 첫 화면의 10% 안에 든다. `consent-actions`(≤400px 전폭 버튼 규칙)는
       설정 화면용이라 여기서는 쓰지 않는다 — 그 규칙이 버튼을 세로로 쌓아 바를 169px로 키웠다. -->
  <section
    v-if="visible"
    ref="barEl"
    aria-labelledby="analytics-consent-title"
    aria-describedby="analytics-consent-detail"
    aria-live="polite"
    class="consent-bar fixed inset-x-0 bottom-0 z-[90] max-h-[30vh] overflow-y-auto border-t border-primary/30 bg-foreground text-background"
    role="region"
  >
    <div class="container py-2">
      <p v-show="expanded" id="analytics-consent-detail" class="pb-2 text-xs leading-5 text-background/80">
        동의한 경우에만 페이지·필터·비교 이용 이벤트를 수집합니다. 건강정보, 검색어 원문, 예산 원값과 개인 식별정보는 전송하지 않습니다.
        <RouterLink class="ml-1 inline-flex min-h-6 items-center font-semibold text-background underline underline-offset-4" to="/privacy">
          개인정보 처리 안내
        </RouterLink>
      </p>
      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2">
          <h2 id="analytics-consent-title" class="text-xs font-semibold sm:text-sm">선택적 이용 분석</h2>
          <button
            class="inline-flex min-h-6 items-center text-xs font-semibold text-background underline underline-offset-4 sm:text-xs"
            type="button"
            aria-controls="analytics-consent-detail"
            :aria-expanded="expanded"
            @click="expanded = !expanded"
          >
            {{ expanded ? "접기" : "자세히" }}
          </button>
        </div>
        <div class="flex shrink-0 gap-2">
          <button class="touch-target rounded-lg border border-background/40 px-4 text-sm font-semibold hover:bg-background/10" type="button" @click="decide('rejected')">
            거부
          </button>
          <button class="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="button" @click="decide('accepted')">
            동의
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 30vh 상한은 Tailwind 임의값(max-h-[30vh])으로 이미 적용된다 — 전문을 펼쳐도
   바 자체가 화면의 30%를 초과하지 않도록 내부 스크롤로 흡수한다. */
.consent-bar {
  box-shadow: 0 -8px 24px -16px rgb(0 0 0 / 45%);
}
</style>
