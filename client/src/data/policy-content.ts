// Long-form Korean policy copy lives in this .ts module instead of .vue templates.
// Why: the brand font subset collects glyphs from every .vue file and its 64 KiB
// budget is nearly full, while .ts files only feed the body font subsets.

export interface PolicySection {
  title: string;
  paragraphs: string[];
}

export interface PolicyLinkItem {
  label: string;
  href: string;
  note: string;
}

export const FOOD_SAFETY_KOREA_URL = "https://www.foodsafetykorea.go.kr";

// Google AdSense privacy disclosure: third-party ad cookies, personalized ads, opt-out.
export const privacyAdsSection: PolicySection = {
  title: "광고와 쿠키",
  paragraphs: [
    "이 사이트는 Google AdSense 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고 사업자는 광고 쿠키를 사용해 사용자의 이전 방문 기록을 바탕으로 광고를 표시합니다.",
    "Google은 광고 쿠키를 이용해 이 사이트와 다른 웹사이트 방문 기록에 기반한 맞춤형 광고를 제공할 수 있습니다. 맞춤형 광고는 아래 페이지에서 언제든지 해제할 수 있습니다.",
  ],
};

export const privacyOptOutLinks: PolicyLinkItem[] = [
  {
    label: "Google 광고 설정",
    href: "https://adssettings.google.com",
    note: "Google 맞춤형 광고를 해제할 수 있습니다.",
  },
  {
    label: "aboutads.info 광고 선택",
    href: "https://www.aboutads.info/choices",
    note: "다른 제3자 사업자의 맞춤형 광고를 일괄 거부할 수 있습니다.",
  },
];

export const privacyAdsClosing =
  "광고 쿠키는 광고 표시에만 관여합니다. 가격·성분 데이터는 식약처 공공데이터를 기반으로 하며, 검색·필터·비교에 입력한 값은 서버로 전송하지 않고 브라우저 안에서만 처리합니다.";

export const termsAdsSections: PolicySection[] = [
  {
    title: "광고 게재",
    paragraphs: [
      "서비스는 Google AdSense 등 제3자 광고를 게재할 수 있습니다. 광고 영역은 콘텐츠와 구분해 표시하며, 광고 게재 여부는 가격효율·함량 순위 계산에 영향을 주지 않습니다.",
    ],
  },
  {
    title: "정보 제공의 한계와 면책",
    paragraphs: [
      "본 서비스의 모든 정보는 일반적인 정보 제공 목적이며 의학적 조언이 아닙니다. 가격효율·함량 순위는 표시 가격과 라벨 함량의 계산 결과일 뿐 효능이나 품질의 순위가 아닙니다.",
      "정보의 정확성을 위해 노력하지만 최신성·완전성을 보장하지 않으며, 서비스 이용과 외부 링크에서의 거래로 발생한 손해에 대해 법령이 허용하는 범위에서 책임을 지지 않습니다.",
    ],
  },
];

// About page: operator identity and data cross-check methodology.
export const aboutOperatorParagraph =
  "ShakiLabs는 생활에 필요한 계산·비교 도구를 만들어 shakilabs.com에서 운영하는 개인 개발 스튜디오입니다. 영양만점의 데이터 수집·검증·게시는 운영자가 직접 수행합니다.";

export const aboutMethodology = {
  lead: "모든 제품 정보는 ",
  linkLabel: "식품안전나라(식약처 건강기능식품 정보)",
  href: FOOD_SAFETY_KOREA_URL,
  tail: "와 공공데이터포털 신고정보로 교차 확인하고, 가격·라벨의 확인일과 원문 해시를 함께 기록합니다.",
};
