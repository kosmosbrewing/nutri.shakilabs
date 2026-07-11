<script setup lang="ts">
import { computed, watch } from 'vue'
import { ShSurface, ShText } from '@shakilabs/ui'
import type { RankingItem } from '@/utils/ranking'
import { formatScore, formatWon } from '@/utils/ranking'
import { buildProductAlternatives } from '@/utils/product-detail'
import { trackAnalytics } from '@/utils/analytics'

const props = defineProps<{
  currentItem: RankingItem
  items: RankingItem[]
}>()

const alternatives = computed(() =>
  buildProductAlternatives(props.items, props.currentItem.product.id),
)

watch(alternatives, (items) => {
  items.forEach((alternative) => trackAnalytics({
    name: 'related_tool_impression',
    from_tool: props.currentItem.product.id,
    to_tool: alternative.item.product.id,
    placement: 'similar_products',
  }))
}, { immediate: true })

function compareLocation(alternative: RankingItem) {
  return {
    name: 'Compare',
    query: { ids: `${props.currentItem.product.id},${alternative.product.id}` },
  }
}

function trackAlternativeClick(toTool: string): void {
  trackAnalytics({
    name: 'related_tool_click',
    from_tool: props.currentItem.product.id,
    to_tool: toTool,
    placement: 'similar_products',
  })
}
</script>

<template>
  <section id="similar-products" class="mt-10" aria-labelledby="similar-products-title">
    <p class="eyebrow">Objective alternatives</p>
    <ShText id="similar-products-title" as="h2" variant="title" class="mt-2">
      1일 비용이 가까운 멀티비타민 대안
    </ShText>
    <p class="mt-3 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">
      같은 멀티비타민 비교군에서 배송비 포함 1일 비용 차이가 작은 순으로 고르고,
      차이가 같으면 영양충족도와 전체 가격효율 순위를 사용했습니다. 개인 적합성 추천은 아닙니다.
    </p>

    <div class="mt-5 grid gap-3 lg:grid-cols-3">
      <ShSurface
        v-for="alternative in alternatives"
        :key="alternative.item.product.id"
        as="article"
        variant="outlined"
        padding="md"
        class="flex flex-col"
      >
        <p class="text-xs font-semibold text-primary">{{ alternative.item.product.brand }}</p>
        <ShText as="h3" variant="heading" class="mt-2">{{ alternative.item.product.officialName }}</ShText>
        <dl class="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-xs">
          <div><dt class="text-muted-foreground">배송비 포함 1일</dt><dd class="mt-1 font-semibold">{{ formatWon(alternative.item.score.dailyCostKrw) }}</dd></div>
          <div><dt class="text-muted-foreground">영양충족도</dt><dd class="mt-1 font-semibold">{{ formatScore(alternative.item.score.coverageScore) }}%</dd></div>
        </dl>
        <p class="mt-3 text-xs text-muted-foreground">현재 제품과 1일 비용 차이 {{ formatWon(alternative.dailyCostGapKrw) }}</p>
        <RouterLink
          :to="compareLocation(alternative.item)"
          class="touch-target mt-4 inline-flex items-center justify-center border border-primary px-3 text-sm font-semibold text-primary hover:bg-accent"
          @click="trackAlternativeClick(alternative.item.product.id)"
        >
          현재 제품과 2개 비교
        </RouterLink>
      </ShSurface>
    </div>

    <a class="touch-target mt-4 inline-flex items-center font-semibold text-primary" href="/nutri#ranking">
      순위로 돌아가 비교 제품 더 고르기
    </a>
  </section>
</template>
