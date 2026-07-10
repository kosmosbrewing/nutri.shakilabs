import type { SourceType } from "@/data/types";

const sourceTypeLabels: Record<SourceType, string> = {
  public_api: "공공데이터",
  manufacturer_label: "제조사 자료",
  official_store: "공식 판매처",
  retailer: "판매 페이지",
};

const fieldLabels: Record<string, string> = {
  officialName: "공식 제품명",
  reportNo: "신고번호",
  manufacturer: "제조사",
  serving: "섭취 기준",
  nutrients: "영양성분",
  package: "패키지 수량",
  price: "판매가",
  shipping: "필수 배송비",
  dailyTarget: "1일 기준치",
  canonicalUnit: "표준 단위",
};

export function getSourceTypeLabel(type: SourceType): string {
  return sourceTypeLabels[type];
}

export function getSourceFieldLabels(fields: string[]): string[] {
  return fields.map((field) => fieldLabels[field] ?? field);
}
