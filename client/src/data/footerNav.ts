import type { SiteFooterSection } from "@shakilabs/ui";

/** 푸터 링크 — 비교 도구와 근거 문서 */
export const FOOTER_SECTIONS: readonly SiteFooterSection[] = [
  {
    title: "비교·순위",
    links: [
      { to: "/compare", label: "성분·가격 비교" },
      { to: "/categories", label: "영양제 종류" },
    ],
  },
  {
    title: "산출 근거",
    links: [
      { to: "/methodology", label: "산정 방법" },
      { to: "/sources", label: "데이터 출처" },
    ],
  },
];
