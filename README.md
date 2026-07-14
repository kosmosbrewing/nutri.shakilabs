# 영양만점

공식 데이터와 검증된 판매 스냅샷을 결합해 멀티비타민과 9개 단일 핵심 성분 영양제의 가격효율을 설명 가능하게 비교하는 서비스.

## 상태

- 디렉터리: `11.nutri`
- Git 저장소명: `nutri.shakilabs`
- 단계: 10개 카테고리 가격효율 구현 및 로컬 릴리스 gate 완료
- production: 28개 indexable page 운영, 2026-07-14 sitemap/canonical audit 통과
- 공통 UI: `@shakilabs/ui` `0.3.7` exact artifact
- APP_ID: `nutri`
- 운영 경로: `https://shakilabs.com/nutri/`
- 개발 포트: `6112`
- 비교 제품군: 멀티비타민·미네랄 1개군 + 핵심 성분 단위가격 9개군
- 공공데이터 전체 스냅샷: API 키 없이 `npm run fetch:data`로 재현
- 선택적 GA4: `VITE_GA_MEASUREMENT_ID` 설정 및 사용자 동의 후에만 로드
- GA4 운영 시 향상된 측정의 브라우저 기록 기반 페이지 변경은 끄고 query 없는 수동 pageview를 사용

## 목표

공식 근거와 투명한 점수로 검색 신뢰를 확보하고, SEO 트래픽을 광고·명확히 표시된 제휴 전환으로 연결해 월 경상수익 자산을 만든다.

## 문서

| 문서 | 목적 |
|---|---|
| `docs/PRODUCT_SPEC.md` | 제품 범위, 사용자 가치, 비목표, 출시 기준 |
| `docs/ARCHITECTURE.md` | 프론트 우선 구조, SSG, 향후 공유 백엔드 경계 |
| `docs/DATA_SCORING_SPEC.md` | 공공데이터 결합, 완전성, 가격, 점수 산식 |
| `docs/SEO_TRUST_SPEC.md` | SEO, YMYL 표현, 출처·제휴 표시 원칙 |
| `docs/RALPH_LOOP_PLAN.md` | 반복 횟수, 검증 명령, 종료·중단 조건 |
| `ISSUES.md` | Ralph Loop 실행 큐와 완료 조건 |
| `MEMORY.md` | 세션을 넘어 유지할 확정 결정 |

## 참조 프로젝트

- `../../TEMP/NutriMax`: 탐색·비교 사용자 흐름만 참고한다.
- `../../TEMP/NutriMaxBackend`: 제품·성분·가격 관계만 참고한다.
- 기존 코드는 SSG, 출처 증거, 테스트 기준이 달라 직접 복사하지 않는다.

## 변경 검증

Launch queue `NUTRI-001`~`NUTRI-015`는 완료됐다. 후속 데이터·UI 변경도 `docs/RALPH_LOOP_PLAN.md`의 검증 순서와 `ISSUES.md`의 deferred 진입 조건을 유지한다.
