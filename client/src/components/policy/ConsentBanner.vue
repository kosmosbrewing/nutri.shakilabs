<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useConsent } from "@/composables/useConsent";

const { decide, decision, ready } = useConsent();
const visible = computed(() => ready.value && decision.value === null);

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
  <!-- v3 section 6.8: fixed bottom bar, occludes less than 30vh, 2 buttons.
       Consent gate logic (useConsent) is unchanged; only position moved to bottom-fixed.
       Plain <section>, not ShSurface. @shakilabs/ui ships after main.css and its `.sh-surface--plain`
       sets `background: transparent` at the same specificity as `bg-foreground`,
       so the utility loses on source order and the dark bar never paints. Only the
       children keep `text-background`, which left light text on the light page
       background at a measured 1.00:1. ShSurface adds nothing else here.

       BL-UX-008: Mobile(<640px)에서 세로 스택 시 220px대까지 커져 콘텐츠를 가렸다.
       고지 문단은 sm: 이상(PC)에서 기존처럼 한 줄로 펼치고, Mobile에서는 1줄로 clamp한다 —
       전문은 링크(개인정보 처리 안내)로 계속 접근 가능하니 텍스트를 지우지 않고 시각적으로만 줄인다. -->
  <section
    v-if="visible"
    ref="barEl"
    aria-labelledby="analytics-consent-title"
    aria-live="polite"
    class="consent-bar fixed inset-x-0 bottom-0 z-[90] max-h-[30vh] overflow-y-auto border-t border-primary/30 bg-foreground text-background"
    role="region"
  >
    <div class="container flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3">
      <div class="min-w-0">
        <div class="flex items-baseline justify-between gap-2 sm:block">
          <h2 id="analytics-consent-title" class="text-xs font-semibold sm:text-sm">선택적 이용 분석</h2>
          <RouterLink
            class="shrink-0 text-[11px] font-semibold text-background underline underline-offset-4 sm:hidden"
            to="/privacy"
          >
            개인정보 처리 안내
          </RouterLink>
        </div>
        <p class="mt-1 line-clamp-1 text-xs leading-5 text-background/80 sm:line-clamp-none">
          동의한 경우에만 페이지·필터·비교 이용 이벤트를 수집합니다. 건강정보, 검색어 원문, 예산 원값과 개인 식별정보는 전송하지 않습니다.
          <RouterLink class="ml-1 hidden font-semibold text-background underline underline-offset-4 sm:inline" to="/privacy">
            개인정보 처리 안내
          </RouterLink>
        </p>
      </div>
      <div class="consent-actions flex shrink-0 justify-end gap-2">
        <button class="touch-target rounded-lg border border-background/40 px-4 text-sm font-semibold hover:bg-background/10" type="button" @click="decide('rejected')">
          거부
        </button>
        <button class="touch-target rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground" type="button" @click="decide('accepted')">
          동의
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 30vh 상한은 Tailwind 임의값(max-h-[30vh])으로 이미 적용된다 — 내용이 많아도
   바 자체가 화면의 30%를 초과하지 않도록 내부 스크롤로 흡수한다. */
.consent-bar {
  box-shadow: 0 -8px 24px -16px rgb(0 0 0 / 45%);
}
</style>
