<script setup lang="ts">
import { onMounted, ref } from "vue";
import { THEME_TOGGLE_LABEL_TO_DARK, THEME_TOGGLE_LABEL_TO_LIGHT } from "@/utils/theme-labels";

// 사이트 전역 테마 키다. 카테고리별로 나누지 않는다 - index.html 스크립트와
// 반드시 같은 키를 사용해야 서비스 간 이동 시에도 테마가 유지된다.
const THEME_STORAGE_KEY = "shakilabs:theme:v1";
type ThemeMode = "light" | "dark";

const theme = ref<ThemeMode>("light");

function applyTheme(next: ThemeMode): void {
  theme.value = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.style.colorScheme = next;
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function toggleTheme(): void {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

onMounted(() => {
  // index.html 스크립트가 이미 .dark를 적용했을 수 있으니 그 상태를 그대로 사용한다.
  theme.value = document.documentElement.classList.contains("dark") ? "dark" : "light";
});
</script>

<template>
  <button
    type="button"
    class="sh-global-header__link"
    :aria-label="theme === 'dark' ? THEME_TOGGLE_LABEL_TO_LIGHT : THEME_TOGGLE_LABEL_TO_DARK"
    @click="toggleTheme"
  >
    <svg
      v-if="theme === 'dark'"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  </button>
</template>
