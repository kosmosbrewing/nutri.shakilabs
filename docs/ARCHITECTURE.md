# 아키텍처 설계 — 11.nutri

- 상태: Draft v0.1
- 기준일: 2026-07-10

## 전제

- 기존 100_MVP 스택과 레이어 규칙을 따른다.
- 1차 출시는 데이터 검증과 SEO 속도를 우선해 프론트엔드 정적 데이터로 동작한다.
- 기존 `TEMP/NutriMaxBackend`는 복사하지 않는다.

## 런타임

| 항목 | 결정 |
|---|---|
| 서비스명 | 영양만점 |
| Git 저장소명 | `nutri.shakilabs` |
| 디렉터리 | `11.nutri/` |
| 프론트 | Vue 3, TypeScript, Tailwind, Radix Vue |
| 렌더링 | Vite SSG, route별 HTML |
| 상태 | URL query + Composition API, 전역 상태 최소화 |
| 테스트 | Vitest |
| 배포 | Vercel |
| URL base | `/nutri/` |
| APP_ID | `nutri` |
| DEV_PORT | `6112` |
| Primary | lime-700 `#4D7C0F` |

## Phase 1 구조

```text
11.nutri/
├── client/
│   ├── public/
│   ├── scripts/
│   │   ├── seo-routes.mjs
│   │   └── validate-static-output.mjs
│   ├── src/
│   │   ├── data/
│   │   │   ├── nutrients.ts
│   │   │   ├── products.ts
│   │   │   ├── offers.ts
│   │   │   └── sources.ts
│   │   ├── utils/
│   │   │   ├── scoring.ts
│   │   │   ├── scoring.test.ts
│   │   │   └── validation.ts
│   │   ├── composables/
│   │   │   └── useRanking.ts
│   │   ├── components/nutri/
│   │   ├── views/
│   │   ├── router/
│   │   └── lib/, common/, ui/
│   └── vite.config.ts
├── docs/
├── ISSUES.md
├── MEMORY.md
└── vercel.json
```

## 의존성 방향

```text
data → utils → composables → components/nutri → views
```

- `data/`는 순수 상수와 타입만 가진다.
- `utils/`는 점수·검증 순수 함수만 가진다.
- `composables/`는 필터와 정렬 상태를 조합한다.
- `common/`, `ui/`, `lib/`는 기존 보일러플레이트를 복사 후 수정하지 않는다.
- view는 200줄을 넘기지 않고 도메인 컴포넌트로 분리한다.

## 라우트

| 경로 | 목적 | 색인 |
|---|---|---|
| `/nutri/` | 서비스 허브와 상위 랭킹 | index |
| `/nutri/multivitamin` | 성인 멀티비타민 전체 랭킹 | index |
| `/nutri/compare` | 선택 제품 비교 | canonical 고정, query 제외 |
| `/nutri/products/:slug` | 제품별 근거 상세 | 검증 제품만 index |
| `/nutri/methodology` | 산식과 결측 정책 | index |
| `/nutri/sources` | 공식 데이터와 갱신 정책 | index |
| `/nutri/about` | 서비스 안내 | index |
| `/nutri/terms` | 이용약관 | index |
| `/nutri/privacy` | 개인정보 처리방침 | index |
| `/nutri/404` | 정적 오류 페이지 | noindex |

## 빌드·서빙

- sitemap에 검증 완료 제품 상세만 포함한다.
- Vite SSG가 route별 `.html`과 `404.html`을 생성한다.
- Vercel은 `cleanUrls: true`와 path 보존 rewrite만 사용한다.
- 모든 route HTML의 title, canonical, H1, app root를 build에서 검증한다.
- SPA index catch-all로 route HTML을 덮는 설정을 금지한다.

## 데이터 흐름

```text
공공데이터 raw + 제조사 라벨 + 가격 캡처
  → 검증·단위 정규화
  → versioned TypeScript dataset
  → scoring pure functions
  → SSG ranking/detail pages
```

- 브라우저에서 공공 API 키를 사용하지 않는다.
- raw 데이터와 원문 hash는 저장소 밖 작업 영역에 보관하고 공개 데이터만 코드에 반영한다.
- Phase 1 갱신은 검증 스크립트와 수동 승인으로 수행한다.

## Phase 2 공유 백엔드

다음 조건 중 하나를 충족할 때만 `00.shakilabs-backend/src/apps/nutri`를 추가한다.

- 공개 제품 30개 초과
- 주 1회 이상 가격 갱신 필요
- 이력 차트와 source evidence API 필요
- 수동 갱신 시간이 주 2시간 초과

백엔드 추가 시에도 제품, 오퍼, 출처, 점수 실행을 분리하고 사용자 약물 정보는 저장하지 않는다.

## 관측성

- route 단위 page view만 수집하고 query를 제거한다.
- 원시 예산과 건강 관련 입력을 분석 이벤트에 보내지 않는다.
- 외부 링크는 판매처, 제품 ID, 제휴 여부만 기록한다.
- 데이터 오류 신고는 제품 ID와 필드만 받고 건강정보는 받지 않는다.

## 롤백 경계

- 데이터와 계산 엔진 변경은 별도 커밋으로 분리한다.
- 점수 산식 버전을 올릴 때 이전 fixture를 보존한다.
- 제품 하나의 근거가 깨지면 전체 배포가 아니라 해당 제품을 랭킹에서 제외할 수 있어야 한다.
