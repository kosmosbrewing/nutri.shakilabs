<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { siteLinkNoteShort } from "@/data/affiliate-disclosure";

const props = withDefaults(
  defineProps<{
    messages: readonly string[];
    intervalMs?: number;
  }>(),
  {
    intervalMs: 4000,
  }
);

const currentIndex = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let mediaQuery: MediaQueryList | null = null;
const prefersReducedMotion = ref(false);

const safeMessages = computed(() =>
  props.messages.length > 0
    ? props.messages
    : [siteLinkNoteShort]
);

const currentMessage = computed(
  () => safeMessages.value[currentIndex.value % safeMessages.value.length]
);

function rotateMessage(): void {
  currentIndex.value = (currentIndex.value + 1) % safeMessages.value.length;
}

function stopTimer(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

function startTimer(): void {
  if (prefersReducedMotion.value || document.visibilityState === "hidden" || timer) {
    return;
  }
  timer = setInterval(rotateMessage, props.intervalMs);
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    stopTimer();
    return;
  }
  startTimer();
}

function handleMotionPreferenceChange(event: MediaQueryListEvent): void {
  prefersReducedMotion.value = event.matches;
  if (event.matches) {
    stopTimer();
    return;
  }
  startTimer();
}

function addMotionListener(): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleMotionPreferenceChange);
    return;
  }
  mediaQuery.addListener(handleMotionPreferenceChange);
}

function removeMotionListener(): void {
  if (!mediaQuery) return;
  if (typeof mediaQuery.removeEventListener === "function") {
    mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
    return;
  }
  mediaQuery.removeListener(handleMotionPreferenceChange);
}

watch(
  () => [props.intervalMs, safeMessages.value.length] as const,
  () => {
    currentIndex.value = currentIndex.value % safeMessages.value.length;
    stopTimer();
    startTimer();
  }
);

onMounted(() => {
  if (typeof window === "undefined") return;
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotion.value = mediaQuery.matches;
  addMotionListener();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  startTimer();
});

onUnmounted(() => {
  stopTimer();
  removeMotionListener();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  mediaQuery = null;
});
</script>

<template>
  <div role="status" aria-live="polite" aria-atomic="true" class="w-full min-w-0">
    <Transition name="ticker-fade" mode="out-in">
      <p :key="currentMessage" class="w-full min-w-0 truncate px-0.5 text-center text-[0.72rem] leading-tight sm:px-0 sm:text-sm">
        {{ currentMessage }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.ticker-fade-enter-active {
  /* 들어올 때를 나갈 때보다 길고 부드럽게 — 대칭이면 '툭 꺼졌다 툭 켜지는' 느낌이 난다 */
  transition: opacity 0.42s cubic-bezier(0, 0, 0.2, 1), transform 0.42s cubic-bezier(0, 0, 0.2, 1);
}

.ticker-fade-leave-active {
  transition: opacity 0.26s cubic-bezier(0.4, 0, 1, 1), transform 0.26s cubic-bezier(0.4, 0, 1, 1);
}

/* 아래에서 올라와 위로 빠진다. 같은 방향으로 흐르게 해야 교체가 이어진 동작으로 읽힌다 */
.ticker-fade-enter-from {
  opacity: 0;
  transform: translateY(0.35em);
}

.ticker-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.35em);
}

/* 모션을 줄이면 이동은 빼고 아주 짧은 페이드만 남긴다 */
@media (prefers-reduced-motion: reduce) {
  .ticker-fade-enter-active,
  .ticker-fade-leave-active {
    transition: opacity 0.12s linear;
  }

  .ticker-fade-enter-from,
  .ticker-fade-leave-to {
    transform: none;
  }
}
</style>
