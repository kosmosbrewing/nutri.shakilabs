# 영양만점 로컬 데이터

## 저장 원칙

- `raw/`는 공공데이터포털 원문 전체 스냅샷이며 Git에 포함하지 않는다.
- `evidence/`는 식품안전나라 공식 상세와 가격 원문을 연결한 재현 입력이며 Git에 포함한다.
- `manifests/latest.json`은 출처, 기준일, 행·열 수, SHA-256을 기록한다.
- 브라우저 번들에는 검증·정규화된 공개 subset만 포함한다.
- `client/src/data/category-catalog.json`은 원본에서 재현 생성한 9개 카테고리 compact subset이다.
- 원문을 수정하지 않는다. 정제 결과는 별도 경로에 생성한다.

## 현재 원본

- 데이터셋: 전국건강기능식품영양성분정보표준데이터
- 제공기관: 식품의약품안전처
- 데이터셋 ID: `15155983`
- 안내 페이지: `https://www.data.go.kr/data/15155983/standard.do`
- 인증: 전체 표준데이터 다운로드에는 API 키 불필요

## 명령

`client/`에서 실행한다.

```bash
npm run fetch:data
npm run fetch:food-safety
npm run fetch:unit-price-evidence
npm run unit-price:build
npm run catalog:build
npm run validate:data
```

제품별 원재료·주의사항 자동 보강에는 식품안전나라 `I0030/C003` 인증키가 별도로 필요하다. 키는 저장소에 기록하지 않고 interactive profile의 `KR_FOOD_DAT`에서만 읽는다.

```bash
TERM=xterm-256color zsh -ic 'npm run fetch:food-safety'
```

`INFO-100`이 반환되면 식품안전나라의 인증키 신청 현황에서 `I0030`과 `C003`이 모두 서비스 신청 목록에 있는지 확인한다. `ERROR-500`은 공식 샘플 호출도 함께 확인하고, 서버가 복구된 뒤 재실행한다. 수집기는 일시 서버 오류를 네 번 재시도하며 완전한 두 서비스 manifest만 갱신한다.
