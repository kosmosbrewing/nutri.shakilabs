<script setup lang="ts">
import PolicyPageLayout from "@/components/policy/PolicyPageLayout.vue";
</script>

<template>
  <PolicyPageLayout
    eyebrow="Publisher"
    title="운영 정보"
    description="영양만점의 운영 주체, 데이터 검증 절차와 수정 요청 방법을 공개합니다."
  >
    <h2>운영 주체</h2>
    <p><strong>영양만점</strong>은 ShakiLabs가 운영하는 멀티비타민 데이터 비교 도구입니다. 의료기관, 약국, 건강기능식품 제조사 또는 판매자의 공식 서비스가 아닙니다.</p>

    <h2>제작 목적</h2>
    <p>패키지 수량과 섭취량이 다른 제품을 배송비 포함 1일 비용으로 환산하고, 공개된 전체 영양 라벨을 동일한 기준으로 비교할 수 있게 만드는 것이 목적입니다.</p>

    <h2>검증 절차</h2>
    <ul>
      <li>식약처·공공데이터포털 신고정보로 제품명, 제조사와 신고번호를 확인합니다.</li>
      <li>제조사 자료 또는 구조화된 판매 페이지에서 전체 라벨과 패키지 조건을 확인합니다.</li>
      <li>가격, 필수 배송비, 수량과 확인일을 기록하고 원문 해시를 보관합니다.</li>
      <li>결측·단위·가격 신선도 gate와 자동 테스트를 통과한 제품만 순위에 포함합니다.</li>
    </ul>

    <h2>전문성의 범위</h2>
    <p>보유하지 않은 의료 자격, 임상 검수 또는 실사용 효능 검증을 주장하지 않습니다. 공개 자료의 구조화와 계산 재현성에 책임 범위를 한정합니다.</p>

    <h2>수정 요청</h2>
    <p>제품 라벨, 가격 또는 출처 오류는 제품명과 확인 가능한 원문을 포함해 <a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a>으로 알려주세요. 근거를 재검증한 뒤 수정 여부를 반영합니다.</p>
  </PolicyPageLayout>
</template>
