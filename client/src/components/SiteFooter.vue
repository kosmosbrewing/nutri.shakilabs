<template>
  <footer class="mt-12 border-t border-border/70 bg-muted/35">
    <div class="container grid gap-7 py-8 sm:grid-cols-[1fr_auto] sm:items-start">
      <div class="max-w-xl">
        <p class="font-brand text-lg">영양만점</p>
        <p class="mt-3 text-xs leading-5 text-muted-foreground">
          영양제 종류를 공식 데이터로 탐색하고, 근거가 완성된 제품군만 가격효율을 비교하는 ShakiLabs 데이터 도구입니다. 질환의 진단·치료·예방을 위한 의료 조언을 제공하지 않습니다.
        </p>
        <p class="mt-2 text-xs font-semibold text-primary">현재 공개된 모든 가격 링크는 비제휴입니다.</p>
      </div>
      <nav aria-label="정책 및 신뢰 정보" class="grid grid-cols-2 gap-x-5 gap-y-1 text-xs sm:grid-cols-3">
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/categories">영양제 종류</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/about">운영 정보</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/methodology">산정 방법</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/sources">데이터 출처</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/privacy">개인정보</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/terms">이용약관</RouterLink>
        <RouterLink class="touch-target inline-flex items-center hover:text-primary" to="/disclosure">광고·제휴</RouterLink>
      </nav>
    </div>
  </footer>
</template>
