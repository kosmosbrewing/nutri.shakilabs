<script setup lang="ts">
import PolicyPageLayout from "@/components/policy/PolicyPageLayout.vue";
import ConsentSettings from "@/components/policy/ConsentSettings.vue";
</script>

<template>
  <PolicyPageLayout
    eyebrow="Privacy"
    title="개인정보 처리 안내"
    description="로그인 없이 이용하며, 선택적 분석은 명시적으로 동의한 경우에만 활성화합니다."
  >
    <h2>기본 원칙</h2>
    <p>영양만점은 계정, 이름, 전화번호, 주소, 생년월일, 질환, 복약 정보와 영양제 섭취 내역을 요구하거나 저장하지 않습니다. 검색·필터·비교는 브라우저 안에서 처리됩니다.</p>

    <h2>선택적 이용 분석</h2>
    <p>사용자가 동의하고 환경에 Google Analytics 측정 ID가 설정된 경우에만 분석 스크립트를 로드할 수 있습니다. 이때 다음과 같이 제한된 이벤트만 전송합니다.</p>
    <ul>
      <li>query 문자열을 제외한 페이지 경로</li>
      <li>적용한 필터의 이름만 전송하며 검색어와 예산 원값은 제외</li>
      <li>비교한 제품 수, 출처 유형, 제품 내부 ID와 비제휴 여부</li>
    </ul>
    <p>건강정보, 복약 정보, 자유 입력 원문과 개인 식별정보는 분석 이벤트 스키마에서 허용하지 않습니다. Google의 데이터 처리는 Google 정책의 적용을 받습니다.</p>

    <h2>브라우저 저장</h2>
    <p>분석 동의 또는 거부 상태를 기억하기 위해 <strong>nutri-analytics-consent</strong> 값을 localStorage에 저장합니다. 브라우저 저장소를 삭제하면 다시 선택할 수 있습니다.</p>

    <h2>외부 링크</h2>
    <p>공공데이터, 제조사 및 판매 페이지를 열면 해당 사이트의 개인정보 처리방침이 적용됩니다. 영양만점은 현재 외부 판매 링크에 사용자 식별 query를 추가하지 않습니다.</p>

    <h2>문의와 선택 변경</h2>
    <p>개인정보 관련 문의는 <a href="mailto:skdba1313@gmail.com">skdba1313@gmail.com</a>으로 접수할 수 있습니다. 저장된 선택은 브라우저 사이트 데이터 삭제로 초기화할 수 있습니다.</p>
    <ConsentSettings />
  </PolicyPageLayout>
</template>
