// Long-form Korean guide copy for the /categories hub lives here, not in the .vue view.
// Why: the brand font subset only scans .vue files and its 64 KiB budget is nearly full.

export interface CategoryStatusGuide {
  status: "ranking" | "unit_price" | "official_catalog";
  label: string;
  title: string;
  body: string;
}

export const categoryStatusLabels: Record<CategoryStatusGuide["status"], string> = {
  ranking: "랭킹 제공",
  unit_price: "가격효율 비교",
  official_catalog: "공식 목록",
};

export const categoryGuideIntro = {
  eyebrow: "Reading guide",
  heading: "종류별 순위를 읽는 법",
  paragraphs: [
    "한 화면에 모든 영양제를 줄 세우면 비교가 빨라 보이지만, 기준이 다른 제품이 섞이면 순위의 뜻이 사라집니다. 오메가3의 1일 EPA+DHA 함량과 유산균의 보장 균수는 같은 자로 잴 수 없기 때문입니다. 그래서 종류를 먼저 나누고, 종류 안에서만 값을 계산합니다.",
    "종류마다 근거가 찬 정도가 다릅니다. 어떤 종류는 핵심 함량과 최신 가격이 모두 확인돼 순위를 열 수 있고, 어떤 종류는 공식 등록 정보만 확인된 상태입니다. 아래 세 가지 상태로 지금 무엇까지 볼 수 있는지 먼저 확인하세요.",
  ],
};

export const categoryStatusGuides: CategoryStatusGuide[] = [
  {
    status: "ranking",
    label: categoryStatusLabels.ranking,
    title: "가격효율 순위를 여는 종류",
    body: "검증한 제품이 4개 이상이고 핵심 함량·총 복용일수·최신 가격이 모두 확인된 상태입니다. 세트 전체 가격과 필수 배송비를 총 복용일수로 나눈 1일 비용을 기준 함량으로 다시 나눠 단위가격을 만들고, 그 값이 낮은 순으로 정렬합니다. 같은 성분을 같은 양만큼 살 때 어느 쪽이 싼지 고르는 데 유용합니다.",
  },
  {
    status: "unit_price",
    label: categoryStatusLabels.unit_price,
    title: "가격효율 비교만 여는 종류",
    body: "근거는 확보했지만 비교군이 4개 미만이라 순위 표기를 열지 않은 상태입니다. 제품별 단위가격과 1일 비용은 그대로 볼 수 있으므로, 이미 후보를 두세 개로 좁힌 뒤 값을 맞춰 볼 때 유용합니다.",
  },
  {
    status: "official_catalog",
    label: categoryStatusLabels.official_catalog,
    title: "공식 목록만 여는 종류",
    body: "식약처 공식 등록 정보는 있지만 핵심 함량이나 최신 가격이 아직 비어 계산을 열지 않은 상태입니다. 제품명·제조사·신고번호로 실제 등록된 제품인지 확인하거나, 그 종류에 어떤 제품이 얼마나 등록돼 있는지 규모를 볼 때 유용합니다.",
  },
];

export const categoryGuideTable = {
  eyebrow: "Comparison basis",
  heading: "종류별로 무엇을 비교하는가",
  lead: "각 종류에서 순위를 만드는 기준과 현재 상태입니다. 종류 이름을 누르면 제품 목록과 공식 등록부로 이동합니다.",
  basisLabel: "비교 기준",
  countLabel: "확인한 규모",
};

export const categoryGuideClosing =
  "순위는 표시 가격과 공식 함량으로 만든 정량 정렬이며 효능·품질·개인 적합성의 순위가 아닙니다. 가격이 바뀌면 같은 산식으로 다시 계산되므로, 각 종류 페이지에 적힌 확인일을 함께 보고 판단하세요.";
