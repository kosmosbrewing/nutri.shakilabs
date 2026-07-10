export interface SeoStaticPage {
  name: string;
  title: string;
  description: string;
  path: string;
  type: "Article" | "WebPage";
}

export const seoStaticPages: SeoStaticPage[] = [
  {
    name: "Compare",
    title: "멀티비타민 성분·가격 나란히 비교 | 영양만점",
    description: "최대 4개 멀티비타민의 배송비 포함 1일 비용과 23개 영양소별 함량·기준 충족률을 같은 표에서 비교합니다.",
    path: "/compare",
    type: "WebPage",
  },
  {
    name: "Methodology",
    title: "가격당 영양효율 점수 계산법 | 영양만점",
    description: "영양소별 100% 상한, 배송비 포함 1일 비용, 미표시·미확인 구분과 가격 신선도 등 value-v1 산식을 공개합니다.",
    path: "/methodology",
    type: "Article",
  },
  {
    name: "Sources",
    title: "멀티비타민 비교 데이터 출처 | 영양만점",
    description: "식약처·공공데이터포털 제품 식별정보와 제조사·판매 페이지의 라벨·가격 근거, 확인일과 검증 해시를 공개합니다.",
    path: "/sources",
    type: "Article",
  },
  {
    name: "About",
    title: "운영 정보와 데이터 검증 절차 | 영양만점",
    description: "영양만점의 운영 주체 ShakiLabs, 제품 식별·라벨·가격 검증 절차, 전문성의 범위와 오류 수정 요청 방법을 안내합니다.",
    path: "/about",
    type: "WebPage",
  },
  {
    name: "Privacy",
    title: "개인정보 처리 안내 | 영양만점",
    description: "로그인과 건강정보 저장 없이 작동하며, 선택적 이용 분석의 수집 항목·동의 저장·외부 링크 처리 원칙을 안내합니다.",
    path: "/privacy",
    type: "WebPage",
  },
  {
    name: "Terms",
    title: "이용약관 | 영양만점",
    description: "멀티비타민 비교 정보의 적용 범위, 가격·라벨 한계, 건강 관련 주의, 외부 서비스와 허용되지 않는 이용을 안내합니다.",
    path: "/terms",
    type: "WebPage",
  },
  {
    name: "Disclosure",
    title: "광고·제휴 공개 원칙 | 영양만점",
    description: "현재 비제휴 상태와 자연 순위 독립성, 향후 제휴 링크·광고의 명확한 표시와 배치 원칙을 공개합니다.",
    path: "/disclosure",
    type: "WebPage",
  },
];
