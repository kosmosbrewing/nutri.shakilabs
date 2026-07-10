export interface SeoProductSummary {
  slug: string;
  name: string;
  rank: number;
  dailyCostLabel: string;
  coverageLabel: string;
}

export const seoProducts: SeoProductSummary[] = [
  { slug: "centrum-silver-men-112", name: "센트룸 실버맨 112정", rank: 1, dailyCostLabel: "269원", coverageLabel: "87.0%" },
  { slug: "alive-women-80", name: "얼라이브 원스데일리 포 우먼 80정", rank: 2, dailyCostLabel: "275원", coverageLabel: "88.7%" },
  { slug: "centrum-women-112", name: "센트룸 우먼 112정", rank: 3, dailyCostLabel: "336원", coverageLabel: "89.9%" },
  { slug: "acebiome-multivitamin-60", name: "에이스바이옴 멀티비타민 60정", rank: 4, dailyCostLabel: "399원", coverageLabel: "90.2%" },
  { slug: "alive-men-60", name: "얼라이브 원스데일리 포 맨 60정", rank: 5, dailyCostLabel: "398원", coverageLabel: "86.3%" },
  { slug: "centrum-men-50", name: "센트룸 포맨 50정", rank: 6, dailyCostLabel: "398원", coverageLabel: "86.2%" },
  { slug: "centrum-silver-women-50", name: "센트룸 실버 우먼 50정", rank: 7, dailyCostLabel: "478원", coverageLabel: "87.2%" },
  { slug: "alive-50-plus-60", name: "얼라이브 원스데일리 50+ 60정", rank: 8, dailyCostLabel: "470원", coverageLabel: "64.3%" },
  { slug: "berocca-30", name: "베로카 멀티비타민 발포정 30정", rank: 9, dailyCostLabel: "477원", coverageLabel: "45.5%" },
  { slug: "alive-milk-thistle-60", name: "얼라이브 원스데일리 + 밀크씨슬 60정", rank: 10, dailyCostLabel: "388원", coverageLabel: "34.8%" },
];
