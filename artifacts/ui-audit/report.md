# UI 및 코드 품질 개선 결과

## 1. 요약
- 서비스: 영양만점; 초기 이슈 17개, 해결 17개, 잔여 0개.
- 현재 이슈: P0 0 / P1 0 / P2 0 / P3 0.
- 최종 gate: typecheck PASS, test PASS, build PASS, lint PASS.
- 브라우저: 1440x900 기본, 390x844 기본, 320x568 200% text의 대표 Critical 3개 조합 PASS.
- DOM: 상태 200, page overflow 0, h1 1개, visible unlabeled control 0, 좁은 텍스트 0, console/page/API 오류 0.
- 대표 카테고리 Lighthouse 접근성 100.
- PC·태블릿·모바일 판정: 최종 대표 조합 PASS. 초기 전체 감사 증거는 로컬 raw artifact로 보존했습니다.
- 코드 판정: 이번 감사 범위의 열린 코드 품질 이슈가 없습니다.

## 2. 최종 검증
| 조합 | 결과 | 근거 |
|---|---|---|
| 1440x900 default | PASS | status·overflow·heading·label·console 자동 측정 |
| 390x844 default | PASS | 모바일 UI와 touch/text 재측정 |
| 320x568 text 200% | PASS | page width와 narrow text 재측정 |
| typecheck → test → build | PASS | 저장소 로컬 명령 |

- 추가 검증: 27개 모바일 대표 라우트에서 12px 미만 판단 텍스트 0, 24px 미만 독립 target 0, document overflow 0.
- 미검증: Firefox, WebKit, 실제 화면낭독기 발화, OS 글꼴 확대, 승인된 visual baseline, 운영 API 쓰기 동작.
- 최종 스크린샷: `../../../artifacts/ui-audit-all/screenshots/final/`.

## 3. 해결 이력
| ID | 초기 심각도 | 초기 문제 | 상태 |
|---|---|---|---|
| NUTRI-AUD-001 | P1 | 선택적 분석 동의 배너가 비교함과 같은 하단 위치를 차지해 비교 CTA를 완전히 가립니다. | resolved |
| NUTRI-AUD-002 | P2 | role=dialog 동의 UI가 나타난 뒤에도 키보드 포커스가 BODY에 남습니다. | resolved |
| NUTRI-AUD-003 | P1 | 200% 텍스트 확대에서 홈 헤더와 주요 문구가 잘리고 핵심 수치 일부가 overflow-hidden 또는 truncate로 손실됩니다. | resolved |
| NUTRI-AUD-004 | P2 | 가격효율 카드의 '가격효율지수' 라벨 대비가 3.34:1로 4.5:1 기준에 미달합니다. | resolved |
| NUTRI-AUD-005 | P2 | 공식 레코드 카드 6개씩의 description list 구조가 유효하지 않아 dt/dd 관계가 보조기술에 전달되지 않습니다. | resolved |
| NUTRI-AUD-006 | P2 | 비교 근거의 독립 링크가 높이 17px이며 프로젝트의 44px touch-target 규칙을 적용하지 않습니다. | resolved |
| NUTRI-AUD-007 | P2 | 로컬 스냅샷 데이터셋명이 320px에서 카드 오른쪽으로 벗어나지만 overflow-hidden에 의해 잘립니다. | resolved |
| NUTRI-AUD-008 | P2 | 랭킹 카드는 1024px 직전까지 모바일 단일열 내부 배치를 사용해 1023px 페이지가 8,358px, 1024px는 4,736px로 1px 경계에서 43% 짧아집니다. | resolved |
| NUTRI-AUD-009 | P2 | 홈은 '나머지는 공식 등록 근거부터', '멀티비타민만 독립 랭킹'이라고 안내해 현재 9개 카테고리 가격효율 기능과 모순됩니다. | resolved |
| NUTRI-AUD-010 | P2 | 핵심 상태·기준값에 10px 텍스트를 사용하며 제품 상세 한 화면에서 10px 요소 42개가 확인됩니다. | resolved |
| NUTRI-AUD-011 | P2 | 27개 '공식 신고' 링크가 제품별 원문이 아니라 두 개의 일반 검색·데이터셋 페이지로만 연결됩니다. | resolved |
| NUTRI-AUD-012 | P2 | 공백 없는 긴 한영 혼합 제품명은 카드 내부 scrollWidth 817px 대비 clientWidth 286px이며 카드가 나머지를 잘라냅니다. | resolved |
| NUTRI-AUD-013 | P2 | 640px 미만 헤더는 '가격 순위'와 '산정 기준'을 숨기고 대체 모바일 메뉴를 제공하지 않습니다. | resolved |
| NUTRI-AUD-014 | P3 | 27개 가격 근거를 동일 카드로 모두 펼쳐 모바일 페이지가 9,090px이며 카테고리 필터나 접기가 없습니다. | resolved |
| NUTRI-AUD-015 | P3 | 영문 eyebrow가 28곳에서 한국어 제목을 반복하며 Category atlas, Choose a lane, Source trail 같은 내부 용어가 사용자 정보보다 장식으로 작동합니다. | resolved |
| NUTRI-AUD-016 | P3 | nutrientValue와 formatAmount 구현이 데스크톱·모바일 비교 컴포넌트에 동일하게 중복되고 formatAmount는 제품 표에도 반복됩니다. | resolved |
| NUTRI-AUD-017 | P3 | README는 여전히 production 배포 전이며 초기 제품군이 멀티비타민뿐이라고 기록합니다. | resolved |

## 4. 열린 문제
전체 machine-readable 필드는 [issues.json](./issues.json)에 있습니다.

현재 열린 제품 이슈가 없습니다.

## 5. 검증 한계
- Lighthouse는 대표 Critical 화면만 검사하며 수동 접근성 검사를 대체하지 않습니다.
- 운영 백엔드·외부 데이터 성공을 추정하지 않았고, 개발 기본값은 명시적 local/offline 상태로 검증했습니다.
- raw screenshots·Lighthouse JSON·임시 스크립트는 .gitignore로 제외하고 본 보고서와 issues.json만 추적합니다.
