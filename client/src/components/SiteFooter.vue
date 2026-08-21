<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ShSiteFooter, ShText } from "@shakilabs/ui";
import { FOOTER_SECTIONS } from "@/data/footerNav";

const year = new Date().getFullYear();

const policyLinks = [
  // 다른 서비스(root)의 /blog 로 나가는 링크 — href를 주면 ShSiteFooter가 RouterLink 대신 <a href>로 그린다
  // to 는 타입상 필수라 사용하지 않는다
  { to: "", href: "/blog", label: "블로그" },
  { to: "/about", label: "운영 정보" },
  { to: "/terms", label: "이용약관" },
  { to: "/privacy", label: "개인정보" },
  { to: "/disclosure", label: "광고·제휴" },
];
</script>

<template>
  <ShSiteFooter
    app="nutri"
    :sections="FOOTER_SECTIONS"
    :policy-links="policyLinks"
    note="현재 공개된 모든 가격 링크는 비제휴입니다."
    site-label="shakilabs.com/nutri"
    :copyright="`Copyright © ${year} shakilabs.com`"
    :link-component="RouterLink"
  >
    <template #lead>
      <p class="font-brand text-lg">영양만점</p>
      <ShText variant="caption" tone="muted">
        영양제 종류를 공식 데이터로 탐색하고, 근거가 완성된 제품군만 가격효율을 비교하는 ShakiLabs 데이터 도구입니다. 질환의 진단·치료·예방을 위한 의료 조언을 제공하지 않습니다.
      </ShText>
    </template>
  </ShSiteFooter>
</template>
