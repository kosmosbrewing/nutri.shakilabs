<script setup lang="ts">
import { computed } from "vue";
import type { CategoryCatalogEntry } from "@/utils/category-catalog";
import { buildCategoryDigest } from "@/utils/category-digest";
import type { UnitPriceRanking } from "@/utils/unit-price";

// 종류마다 등록부·검증 제품에서 계산한 값만 싣는다. 문장 틀은 utils/category-digest*.ts에 있고
// 여기서는 그리기만 한다 — 방향·경계 문장을 테스트가 고정할 수 있게 뷰에 문장을 두지 않는다.
const props = defineProps<{ category: CategoryCatalogEntry; ranking: UnitPriceRanking | null }>();
const digest = computed(() => buildCategoryDigest(props.category, props.ranking));
</script>

<template>
  <section class="border-b border-border/60" aria-labelledby="category-digest-title" data-category-digest>
    <div class="sh-container sh-container--tool py-10 sm:py-14">
      <p class="eyebrow">Data digest</p>
      <h2 id="category-digest-title" class="mt-2 break-keep font-brand text-2xl sm:text-3xl">{{ digest.heading }}</h2>
      <p class="mt-3 max-w-3xl break-keep text-sm leading-6 text-muted-foreground">{{ digest.intro }}</p>
      <div class="mt-7 grid gap-8 lg:grid-cols-2">
        <div v-for="group in digest.groups" :key="group.id" class="min-w-0" :data-digest-group="group.id">
          <p class="text-xs font-semibold text-muted-foreground">{{ group.label }}</p>
          <ol class="mt-3 divide-y divide-border border-y border-border">
            <li v-for="finding in group.findings" :key="finding.id" class="py-4" :data-digest-finding="finding.id">
              <h3 class="break-keep text-base font-semibold leading-snug">{{ finding.title }}</h3>
              <p class="mt-2 break-keep text-sm leading-6 text-muted-foreground">{{ finding.body }}</p>
            </li>
          </ol>
        </div>
      </div>
      <p class="mt-6 break-keep text-xs leading-5 text-muted-foreground">{{ digest.sourceNote }}</p>
    </div>
  </section>
</template>
