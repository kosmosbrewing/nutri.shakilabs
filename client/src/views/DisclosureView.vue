<script setup lang="ts">
import PolicyPageLayout from "@/components/policy/PolicyPageLayout.vue";
</script>

<template>
  <PolicyPageLayout
    eyebrow="Disclosure"
    title="광고·제휴 공개"
    description="자연 순위와 수익화 영역을 분리하고 외부 링크의 경제적 이해관계를 명확히 표시합니다."
  >
    <h2>현재 상태</h2>
    <p><strong>2026-07-10 현재 모든 가격·판매처 링크는 비제휴입니다.</strong> 링크 클릭이나 구매로 영양만점이 수수료를 받지 않으며 AdSense 광고 로더도 활성화하지 않았습니다.</p>

    <h2>자연 순위 원칙</h2>
    <p>가격효율 순위는 공개된 value-v1 산식으로 계산하며 광고비, 제휴 여부, 판매자 요청과 수수료율을 입력값으로 사용하지 않습니다. 제휴 관계가 생겨도 동일한 산식을 유지합니다.</p>

    <h2>향후 제휴 링크</h2>
    <ul>
      <li>외부 링크 바로 옆에 <strong>제휴 링크</strong> 또는 <strong>수수료 발생 가능</strong>을 표시합니다.</li>
      <li>제휴 링크가 아닌 경우 현재처럼 비제휴라고 표시합니다.</li>
      <li>제휴 제품만 별도 추천하거나 자연 순위와 섞어 우대하지 않습니다.</li>
    </ul>

    <h2>광고 원칙</h2>
    <p>광고가 활성화되면 <strong>광고</strong> 레이블과 별도 영역을 사용하고 자연 순위 카드 안에 삽입하지 않습니다. 계산·비교 버튼과 혼동되는 위치, 오류·404·noindex 화면에는 광고를 두지 않습니다.</p>

    <h2>문의</h2>
    <p>표시 누락이나 이해관계 관련 문의는 <a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a>으로 접수합니다.</p>
  </PolicyPageLayout>
</template>
