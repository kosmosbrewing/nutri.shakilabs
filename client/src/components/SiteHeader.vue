<template>
  <header class="border-b border-border/70 bg-background/90 backdrop-blur">
    <div class="container flex min-h-16 items-center justify-between gap-4">
      <RouterLink class="touch-target inline-flex items-center gap-2.5 font-brand text-lg" to="/">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
          영
        </span>
        <span>영양만점</span>
      </RouterLink>
      <nav aria-label="주요 메뉴" class="flex items-center gap-1 sm:gap-3">
        <RouterLink class="touch-target inline-flex items-center px-2 text-sm font-semibold hover:text-primary" :to="{ path: '/', hash: '#ranking' }">
          가격효율 순위
        </RouterLink>
        <RouterLink class="touch-target hidden items-center px-2 text-sm font-semibold hover:text-primary sm:inline-flex" to="/methodology">
          산정 기준
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
