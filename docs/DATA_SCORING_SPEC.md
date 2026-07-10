# 데이터·점수 설계 — 11.nutri

- 상태: Draft v0.2
- 기준일: 2026-07-11
- 산식 버전: `value-v1`, `unit-price-v1`

## 원칙
- 공식 데이터는 제품 식별과 안전 정보의 정본이다.
- 제조사 라벨은 제품별 전체 미량영양소 함량의 보강 근거다.
- 판매 데이터는 변동 가능한 스냅샷이며 정본과 분리한다.
- 알 수 없는 값은 0이 아니다.
- 동일 제품군과 동일 목표 영양소 집합 안에서만 순위를 계산한다.

## 카테고리 확장 경계
- `value-v1`은 검증된 일반 성인용 멀티비타민·미네랄에만 적용한다.
- 비타민D, 비타민C, 칼슘은 공식 핵심 함량과 가격 근거를 갖춘 `unit-price-v1` 비교를 제공한다.
- 프로바이오틱스, 오메가3, 마그네슘, MSM, 코엔자임Q10, 밀크씨슬은 우선 공식 등록 탐색 카탈로그로 제공한다.
- 카탈로그의 레코드 수는 공공데이터 원문 행 수이며 현재 판매 중인 고유 상품 수가 아니다.
- 카탈로그 예시는 추천이나 순위가 아니며 가격효율 점수를 계산하지 않는다.
- 새 카테고리는 핵심 기능성 함량, 총 복용일수, 최신 가격, 전체 라벨 근거를 확보하고 별도 산식 버전을 검증한 뒤 독립 랭킹으로 승격한다.

## unit-price-v1
`unit-price-v1`은 영양소 충족률을 합산하는 멀티비타민 `value-v1`과 섞지 않는다. 같은 카테고리의 핵심 기능성분 1개만 동일 단위로 정규화해 가격을 오름차순 비교한다.

| 카테고리 | 핵심 성분 | 표시 기준 |
|---|---|---|
| 비타민D | 1일 비타민D | 10 ug당 가격 |
| 비타민C | 1일 비타민C | 100 mg당 가격 |
| 칼슘 | 1일 칼슘 | 100 mg당 가격 |

```text
totalDays = totalUnitsPerPackage * packageCount / unitsPerDay
dailyCost = (listedPriceKrw + mandatoryShippingKrw) / totalDays
unitPrice = dailyCost / (dailyActiveAmount / basisAmount)
monthlyCost = dailyCost * 30
```

- 가격은 비회원 일반 판매가와 필수 배송비를 사용한다.
- 세트 상품은 전체 가격과 전체 복용일수로 계산한다.
- 순위는 같은 카테고리 안에서 `unitPrice`가 낮은 순서다.
- 핵심 성분 외 영양소, 원료 형태, 흡수율, 알약 크기와 개인 적합성은 점수에 반영하지 않는다.
- 낮은 단위가격이나 높은 함량을 복용 권장으로 해석하지 않도록 모든 비교 영역에 고지를 표시한다.
- 품절, 30일 초과 가격, 공식 신고번호·핵심 함량·총 복용일수 중 하나라도 불명확한 제품은 제외한다.
- 동점은 confidence, 가격 확인일, 제품명 순으로 정렬한다.

## 소스 우선순위
| 단계 | 소스 | 역할 |
|---|---|---|
| 1 | 전국건강기능식품영양성분정보 | 구조화 영양성분, 제공량, 신고번호 |
| 1 | 건강기능식품 품목제조 신고 API | 제품명, 제조사, 섭취법, 기능성, 주의사항 |
| 2 | 제조사 공식 라벨·제품 페이지 | 누락 영양소, 총수량, 1일 섭취량 |
| 3 | 공식몰·가격비교·공개 판매 페이지 | 가격, 배송비, 패키지 구성 |
| 4 | OCR | 파싱 보조만 허용, 자동 공개 금지 |

공식 URL:

- `https://www.data.go.kr/data/15155983/standard.do`
- `https://www.data.go.kr/data/15058865/openapi.do`
- `https://www.foodsafetykorea.go.kr/api/`
- `https://www.kns.or.kr/FileRoom/FileRoom.asp?BoardID=Kdr`

## 핵심 엔티티

```ts
type Product = {
  id: string;
  slug: string;
  officialName: string;
  brand: string;
  manufacturer: string;
  reportNo: string;
  form: "tablet" | "capsule" | "powder" | "liquid" | "gummy";
  servingsPerDay: number;
  unitsPerServing: number;
  totalUnits: number;
  totalDays: number;
  confidence: "A" | "B" | "C";
  status: "draft" | "rankable" | "stale" | "excluded";
};

type ProductNutrient = {
  productId: string;
  nutrientId: string;
  amountPerServing: number | null;
  canonicalUnit: "mg" | "ug";
  originalValue: string;
  presence: "verified" | "absent" | "unknown";
  sourceId: string;
};

type OfferSnapshot = {
  productId: string;
  seller: string;
  listedPriceKrw: number;
  mandatoryShippingKrw: number;
  quantityMultiplier: number;
  capturedAt: string;
  url: string;
  affiliate: boolean;
};

type SourceEvidence = {
  id: string;
  type: "public_api" | "manufacturer_label" | "official_store" | "retailer";
  title: string;
  url: string;
  verifiedAt: string;
  rawHash: string;
  extraction: "api" | "text" | "manual" | "ocr";
};
```

## 결합 키

- 1순위: 품목제조신고번호
- 2순위: 정규화 제품명 + 제조사 + 1회분량
- 판매 오퍼는 제품과 분리하고 세트 수량을 `quantityMultiplier`로 저장한다.
- 이름 유사도만으로 자동 병합하지 않는다.

## 단위 규칙

- 저장 단위는 `mg`, `ug`만 허용한다.
- `mcg`, `μg`, `㎍`는 `ug`로 정규화한다.
- `1 mg = 1000 ug`만 자동 변환한다.
- IU는 영양소와 화학형태가 확인되지 않으면 자동 변환하지 않는다.
- D2/D3, K1/K2, 산화물/구연산염 차이는 v1 점수에 반영하지 않는다.

## 완전성 Gate

제품은 아래 조건을 모두 충족해야 `rankable`이 된다.

- 공식 신고번호와 제품명이 일치한다.
- 1회분량, 일일 횟수, 총수량, 총복용일수가 확인된다.
- 전체 라벨 근거가 있어 `absent`와 `unknown`을 구분할 수 있다.
- 필수 목표 영양소의 `unknown`이 0개다.
- 가격, 배송비, 패키지 배수가 확인된다.
- 가격 확인일이 30일 이내다.
- 모든 영양소와 가격에 source evidence가 연결된다.
- confidence가 A 또는 B다. C는 상세 열람만 가능하고 랭킹에서 제외한다.

## 목표 기준

- v1 일반 성인 비교는 식품 표시용 1일 영양성분기준치를 사용한다.
- 2025 KDRI는 설명과 향후 연령·성별 모드의 근거로만 사용한다.
- 임신·수유·질환 조건은 v1에 적용하지 않는다.
- 목표 영양소 집합은 모든 제품에 동일하며 데이터 파일에 버전으로 고정한다.

## 산식

영양소 `n`, 제품 `i`에 대해:

```text
dailyAmount(i,n) = amountPerServing(i,n) × servingsPerDay(i)
coverage(i,n) = min(dailyAmount(i,n) / target(n), 1)
coverageScore(i) = 100 × Σ(weight(n) × coverage(i,n)) / Σweight(n)
dailyCost(i) = (listedPrice + mandatoryShipping) / totalDays
valueIndex(i) = 100 × coverageScore(i) / dailyCost(i)
```

- v1의 weight는 모두 1이다.
- 100% 초과 함량은 추가 점수를 주지 않는다.
- 미표시가 라벨 전체 확인으로 검증되면 `absent=0`으로 계산한다.
- `unknown`이 하나라도 있으면 점수를 계산하지 않는다.
- 화면에는 coverageScore, dailyCost, valueIndex를 모두 표시한다.
- 동점은 confidence, 최신 가격, 제품명 순으로 정렬한다.

## 안전 정보

- 상한섭취량은 음식·다른 보충제를 포함할 수 있으므로 제품 라벨만으로 임의 감점하지 않는다.
- 공식 주의사항과 명확한 기준 초과 가능성은 별도 경고 배지로 표시한다.
- 안전 배지는 순위와 독립적으로 보여준다.
- 약물 상호작용은 자동 판정하지 않고 전문가 상담 안내만 제공한다.

## 가격 규칙

- 기본 가격은 비회원이 조건 없이 결제 가능한 판매가다.
- 필수 배송비는 포함하고 선택 배송·적립금은 제외한다.
- 회원가, 카드 할인, 쿠폰, 구독 할인은 기본 점수에서 제외한다.
- 14일 초과는 `갱신 필요`, 30일 초과는 `stale`로 랭킹 제외한다.
- 품절 오퍼는 즉시 제외하고 다음 검증 오퍼를 사용한다.

## 신뢰도

| 등급 | 조건 |
|---|---|
| A | 공식 신고 + 구조화 성분 + 제조사 전체 라벨 + 직접 가격 근거 |
| B | 공식 신고 + 제조사/신뢰 판매처 전체 라벨 + 직접 가격 근거 |
| C | OCR 또는 비정형 판매처에 핵심 필드가 의존함 |

## 테스트 Gate

- 0%, 50%, 100%, 100% 초과 캡핑
- mg↔ug 변환과 IU 거부
- 배송비 포함 가격
- 세트 수량과 총복용일수
- `unknown` 점수 거부와 `absent` 0 처리
- 14일·30일 가격 경계
- 동점 정렬
- 보고서 예제 2개를 재검증한 golden fixture
