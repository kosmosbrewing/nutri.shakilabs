# ADR 001: 정적 폰트 서브셋을 사전 생성한다

- 상태: Accepted
- 날짜: 2026-07-10

## Context

초기 Pretendard와 GmarketSans 파일은 합계 1.43MiB로, 모바일 첫 화면의 CSS와 네트워크 우선순위를 경쟁해 LCP를 지연시켰다. 서비스 문자열은 SSG와 검증된 로컬 데이터로 한정되어 있어 실제 사용하는 글리프 집합을 빌드 전에 결정할 수 있다.

## Decision

- 전체 WOFF2는 `client/fonts/source/`에 보존하고 배포하지 않는다.
- `npm run fonts:subset`은 Python `fontTools`로 현재 UI 문자열의 서브셋과 해시 manifest를 생성한다.
- 생성된 WOFF2와 manifest는 Git에 포함한다.
- 일반 build와 CI는 Python 도구에 의존하지 않고, 생성물 해시·문자 집합 해시·180KiB 총량을 검증한다.
- UI 문자열이 바뀌어 해시가 달라지면 build를 실패시키고 서브셋 재생성을 요구한다.

## Consequences

초기 폰트 전송량은 109KiB로 줄어든다. 새 글리프를 추가한 개발 환경에서만 Python 3, `fontTools`, WOFF2용 Brotli 지원이 필요하며, 재생성하지 않은 글리프 누락은 릴리스 gate에서 차단된다.
