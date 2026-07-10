# 11.nutri 실행 큐

상태 값: `PENDING`, `IN_PROGRESS`, `DONE`, `BLOCKED`, `DEFERRED`

## Launch Queue

| ID | 상태 | 작업 | 의존성 | 완료 조건 |
|---|---|---|---|---|
| NUTRI-001 | DONE | Vue 3 SSG 프로젝트 scaffold | 없음 | `/nutri/` 부팅, lint/typecheck/test/build 스크립트 존재 |
| NUTRI-002 | DONE | 디자인 토큰·레이어·CI 구성 | 001 | lime 토큰, 6112 포트, 레이어 lint, GitHub CI 통과 |
| NUTRI-003 | DONE | 데이터 타입·Zod 공개 데이터 검증 | 001 | Product/Nutrient/Offer/Source safeParse 테스트 통과 |
| NUTRI-004 | DONE | `value-v1` 점수 엔진 | 003 | 캡핑·결측·단위·가격·정렬 golden test 통과 |
| NUTRI-005A | DONE | 영양만점 프로젝트·저장소 정체성 반영 | 001 | 서비스명과 `nutri.shakilabs` 저장소명 문서·UI 일치 |
| NUTRI-005B | DONE | 공공 영양성분 전체 로컬 스냅샷 | 003 | 전체 5,556건, 원문 hash, 재현 스크립트, raw Git 제외 |
| NUTRI-005 | PENDING | 검증 제품 10개 evidence dataset | 003,004,005B | A/B 10개, unknown 0, 가격 30일 이내 |
| NUTRI-006 | PENDING | 랭킹·필터 UI | 004,005 | 기본 결과 즉시 표시, 모바일 overflow 없음 |
| NUTRI-007 | PENDING | 최대 4개 비교 UI | 006 | 모바일 카드·데스크톱 표·출처 표시 동작 |
| NUTRI-008 | PENDING | 제품 상세·방법론·출처 페이지 | 005 | 제품별 근거와 산식·결측·가격 정책 노출 |
| NUTRI-009 | PENDING | SSG·sitemap·404·canonical | 006,007,008 | route별 고유 HTML, self-canonical, 실제 404 |
| NUTRI-010 | PENDING | 정책·분석·제휴 표시 | 008 | 의료 고지, 개인정보 최소화, GA 이벤트, 제휴 구분 |
| NUTRI-011 | PENDING | 전체 QA·preview·release gate | 009,010 | Ralph Loop 완료 조건 전체 통과 |

## Deferred Queue

| ID | 상태 | 작업 | 재개 조건 |
|---|---|---|---|
| NUTRI-D01 | DEFERRED | 공유 백엔드와 가격 이력 | 공개 제품 30개 또는 수동 갱신 주 2시간 초과 |
| NUTRI-D02 | DEFERRED | 자동 공공데이터 수집 배치 | API 제한 운영 안정성과 키 확보 |
| NUTRI-D03 | DEFERRED | OCR 보조 | 텍스트·공식 라벨로 확보 불가한 제품 증가 |
| NUTRI-D04 | DEFERRED | 연령·성별 KDRI 모드 | 일반 성인 v1 검증과 전문가 리뷰 완료 |
| NUTRI-D05 | DEFERRED | 약물 상호작용 안내 | 영양제 적용 근거와 전문가 검토 확보 |
| NUTRI-D06 | DEFERRED | AdSense 로더 | 승인 완료 |

## Iteration Log

| 반복 | 이슈 | 결과 | 검증 | 메모 |
|---|---|---|---|---|
| 1 | NUTRI-001 | DONE | lint, typecheck, test, build, audit 통과 | `/nutri/` SSG 2개 route 생성, 타입 오류 1회 보정 |
| 2 | NUTRI-002 | DONE | 전체 로컬 CI 명령 통과 | lime 토큰, 레이어 제한, GitHub workflow 구성 |
| 3 | NUTRI-003 | DONE | 6 tests와 전체 CI 통과 | strict date, unknown/absent, cross-reference 검증 |
| 4 | NUTRI-004 | DONE | 13 tests와 전체 CI 통과 | 보고서 2개 입력을 `value-v1`로 재산정 |
| 5 | NUTRI-005A | DONE | 전체 CI 통과 | 서비스 `영양만점`, 저장소 `nutri.shakilabs` 고정 |
| 6 | NUTRI-005B | DONE | 5,556행·62열·hash 및 전체 CI 통과 | raw 9.3MB Git 제외, fetch/verify 재현 가능 |

## Queue Rules

- 한 번에 하나의 Launch 이슈만 `IN_PROGRESS`일 수 있다.
- dependency가 끝나지 않은 이슈를 먼저 시작하지 않는다.
- 데이터 근거 충돌은 해당 이슈를 `BLOCKED`로 만들고 문서에 출처를 남긴다.
- 완료 조건 일부만 통과한 이슈는 `DONE`으로 표시하지 않는다.
- Deferred 이슈를 Launch Queue로 옮기려면 사용자 승인이 필요하다.
