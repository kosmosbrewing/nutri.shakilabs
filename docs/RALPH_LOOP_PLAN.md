# Ralph Loop 실행 계획 — 11.nutri

- 상태: Complete through NUTRI-014
- 모드: Issue Fix Loop
- 최대 반복: 24회
- 이슈당 최대 재시도: 3회
- 큐: `../ISSUES.md`

## Goal

공식 근거가 연결된 성인용 멀티비타민 10개와 영양제 카테고리 9개를 대상으로 가격당 영양효율·단위가격 비교, 제품 상세, 방법론을 SSG로 출시 가능한 상태까지 완성한다.

## 완료 상태

아래 조건을 모두 만족해야 루프를 종료한다.

- `ISSUES.md`의 Launch 필수 이슈가 모두 `DONE`이다.
- 제품 10개가 A/B 신뢰도와 완전성 gate를 통과한다.
- 9개 단위가격 카테고리가 각 3개 현재 판매 제품과 공식 함량 근거를 갖춘다.
- 산식, 결측, 가격, 정렬 golden test가 통과한다.
- typecheck, test, build, static output 검증이 모두 통과한다.
- sitemap route가 고유 HTML과 self-canonical을 반환한다.
- 360px, 390px, 430px에서 overflow와 핵심 접근성 오류가 없다.
- 의료 오인, 출처 누락, 숨은 제휴 링크가 없다.
- npm audit high 이상 취약점이 없다.

## 반복 프로토콜

각 반복은 정확히 한 이슈만 처리한다.

1. `ISSUES.md`에서 dependency가 끝난 가장 위의 `PENDING` 이슈를 선택한다.
2. 상태를 `IN_PROGRESS`로 바꾸고 이번 반복 번호를 기록한다.
3. 이슈 완료에 필요한 최소 파일만 수정한다.
4. 이슈별 검증과 공통 검증을 실행한다.
5. 결과가 통과하면 `DONE`, 실패하면 원인과 재시도 횟수를 기록한다.
6. 3회 실패하면 `BLOCKED`로 바꾸고 독립 이슈만 계속할 수 있다.
7. 완료 조건을 평가하고 충족하면 즉시 종료한다.

## 반복 보고 형식

```text
iteration: N/24
issue: NUTRI-XXX
what_changed: 변경 요약
validation_result: 실행 명령과 결과
decision: DONE | RETRY | BLOCKED
next_step: 다음 이슈 또는 종료
```

## 검증 명령

프로젝트 scaffold 이후 매 반복에서 변경 범위에 맞게 아래 순서를 유지한다.

```text
npm run lint
npm run lint:layers
npm run typecheck
npm test
npm run validate:data
npm run build
npm run verify:static
npm audit --audit-level=high
```

- `verify:static`이 생성되기 전 반복은 명령 미존재를 기록하고 관련 이슈 완료 후 필수화한다.
- 데이터 변경 반복은 추가로 `npm run validate:data`를 실행한다.
- UI 변경 반복은 390px DOM과 screenshot을 확인한다.

## 단계별 Gate

| 단계 | 이슈 | Gate |
|---|---|---|
| Foundation | 001~002 | 앱 부팅, 레이어 구조, 기본 CI |
| Engine | 003~004 | 점수·검증 테스트 통과 |
| Evidence | 005 | 제품 10개 완전성 통과 |
| Experience | 006~008 | 랭킹·비교·상세·방법론 동작 |
| SEO | 009 | SSG, sitemap, 404, canonical 통과 |
| Trust | 010 | 분석·정책·제휴 표시 통과 |
| Release | 011 | 전체 품질·preview·live gate 통과 |
| Expansion | 012~014 | 9개 종류·27개 단위가격 오퍼·공식 근거·모바일 QA 통과 |

## 중단 조건

다음 상황에서는 루프를 멈추고 사용자 판단을 요청한다.

- 공공데이터와 제조사 라벨의 핵심 함량이 충돌한다.
- 검증 가능한 제품이 10개 미만이다.
- 가격 수집이 판매처 약관 또는 접근 제한과 충돌한다.
- 의료·법률 표현에 전문가 검토가 필요한 범위가 생긴다.
- 공유 컴포넌트 수정 또는 새 라이브러리 도입이 필요하다.
- production 배포, 도메인 연결, 제휴 링크 활성화 직전이다.

## 금지 사항

- 실패한 테스트를 삭제하거나 gate를 낮춰 종료하지 않는다.
- `unknown`을 0으로 바꾸지 않는다.
- 출처가 없는 보고서 숫자를 fixture로 확정하지 않는다.
- 여러 저장소를 한 반복에서 수정하지 않는다.
- 이슈 둘 이상을 한 커밋에 섞지 않는다.
- 광고 수익을 위해 자연 순위를 변경하지 않는다.

## 반복 예산

- 1~2: scaffold와 설정
- 3~5: 데이터 타입, 검증, 점수 엔진
- 6~9: 제품 10개 증거 수집·보정
- 10~15: 랭킹, 필터, 비교, 상세
- 16~19: 방법론, 출처, 정책, 분석
- 20~22: SSG, 모바일, 접근성, 성능
- 23: preview와 데이터 재검증
- 24: production 직전 최종 gate

예산은 순서 가이드이며, 완료 조건을 일찍 충족하면 즉시 종료한다.

## 롤백

- 매 이슈를 독립 커밋으로 만든다.
- 데이터 오류는 제품 status를 `excluded`로 바꿔 즉시 랭킹에서 제거한다.
- 산식 변경은 버전을 올리고 이전 fixture를 보존한다.
- 배포 실패 시 직전 Vercel deployment로 되돌리고 원인 이슈를 재개한다.
