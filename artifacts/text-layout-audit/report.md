# 텍스트 배치 개선 결과

## 결과
- 대상: 영양만점 13개 라우트, 브라우저 65개 상태.
- 최종 판정: page overflow, 값·단위/컨트롤 줄바꿈, 텍스트 overflow, 고아줄, 슬라이더 오류 모두 0건.
- `npm run typecheck` → `npm test` → `npm run build` 통과, 47개 테스트와 ESLint/layer lint 통과.

## 적용 내용
- 랭킹·비교 지표와 카테고리 요약을 모바일 한 열로 바꾸고 consent 버튼을 전체 폭으로 재배치했습니다.
- `EPA+DHA`와 `100 mg당`은 두 의미 조각 사이에서만 줄바꿈해 숫자·단위·`당`을 분리하지 않습니다.
- 출처 카드의 신고번호·긴 제조사/근거 문구는 핵심 정보를 생략하지 않고 컨테이너 안에서 줄바꿈합니다.

## 관련 코드
- [responsive-accessibility.css](../../client/src/assets/css/responsive-accessibility.css)
- [UnitPriceComparison.vue](../../client/src/components/category/UnitPriceComparison.vue)
- [CategoryRecordCard.vue](../../client/src/components/category/CategoryRecordCard.vue)
- [ComparisonMobileCards.vue](../../client/src/components/compare/ComparisonMobileCards.vue)
- [SourcesView.vue](../../client/src/views/SourcesView.vue)

근거: `../../../artifacts/text-layout-audit/final-consolidated-summary.json`, `../../../artifacts/text-layout-audit/computed-style-evidence.json`. 열린 이슈는 [issues.json](./issues.json)입니다.
