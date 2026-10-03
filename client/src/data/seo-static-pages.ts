import { disclosureMetaDescription } from "./affiliate-disclosure";

export interface SeoStaticPage {
  name: string;
  /** 접미사 없는 페이지 제목. 접미사는 utils/seo-title이 titleKind에 따라 붙인다. */
  pageTitle: string;
  /** tool: "{제목} | ShakiLabs" · site: "{제목} · 영양제 가격 비교 | ShakiLabs" (허브·방법·정책) */
  titleKind: "tool" | "site";
  description: string;
  path: string;
  type: "Article" | "WebPage";
}

export const seoStaticPages: SeoStaticPage[] = [
  {
    name: "Categories",
    pageTitle: "영양제 종류별 가격효율 순위",
    titleKind: "site",
    description: "비타민D, 유산균, 오메가3, 마그네슘 등 9개 영양제 종류의 핵심 성분 단위가격 순위와 가격효율지수를 제공합니다.",
    path: "/categories",
    type: "WebPage",
  },
  {
    name: "Compare",
    pageTitle: "멀티비타민 성분·가격 나란히 비교",
    titleKind: "tool",
    description: "최대 4개 멀티비타민의 배송비 포함 1일 비용과 23개 영양소별 함량·기준 충족률을 같은 표에서 비교합니다.",
    path: "/compare",
    type: "WebPage",
  },
  {
    name: "Methodology",
    pageTitle: "가격당 영양효율 점수 계산법",
    titleKind: "site",
    description: "영양소별 100% 상한과 9개 영양제 종류의 상대 가격효율지수, 기준 단위가격, 배송비 포함 1일 비용 산식을 공개합니다.",
    path: "/methodology",
    type: "Article",
  },
  {
    name: "Sources",
    pageTitle: "가격·성분 데이터 출처",
    titleKind: "site",
    description: "가격효율지수와 단위가격에 사용한 식품안전나라 제품·핵심 함량, 제조사·판매 페이지의 가격 근거와 확인일을 공개합니다.",
    path: "/sources",
    type: "Article",
  },
  {
    name: "About",
    pageTitle: "운영 정보와 데이터 검증 절차",
    titleKind: "site",
    description: "영양만점의 운영 주체 ShakiLabs, 제품 식별·라벨·가격 검증 절차, 전문성의 범위와 오류 수정 요청 방법을 안내합니다.",
    path: "/about",
    type: "WebPage",
  },
  {
    name: "Privacy",
    pageTitle: "개인정보 처리 안내",
    titleKind: "site",
    description: "로그인과 건강정보 저장 없이 작동하며, 선택적 이용 분석의 수집 항목·동의 저장·외부 링크 처리 원칙을 안내합니다.",
    path: "/privacy",
    type: "WebPage",
  },
  {
    name: "Terms",
    pageTitle: "이용약관",
    titleKind: "site",
    description: "멀티비타민 비교 정보의 적용 범위, 가격·라벨 한계, 건강 관련 주의, 외부 서비스와 허용되지 않는 이용을 안내합니다.",
    path: "/terms",
    type: "WebPage",
  },
  {
    name: "Disclosure",
    pageTitle: "광고·제휴 공개 원칙",
    titleKind: "site",
    description: disclosureMetaDescription,
    path: "/disclosure",
    type: "WebPage",
  },
];
