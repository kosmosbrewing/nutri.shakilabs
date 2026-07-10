import type { Product, ProductForm } from "./types";

interface ProductInput {
  id: string;
  officialName: string;
  brand: string;
  manufacturer: string;
  reportNo: string;
  totalUnits: number;
  labelSourceId: string;
  confidence?: "A" | "B";
  form?: ProductForm;
}

function createProduct(input: ProductInput): Product {
  return {
    id: input.id,
    slug: input.id,
    officialName: input.officialName,
    brand: input.brand,
    manufacturer: input.manufacturer,
    reportNo: input.reportNo,
    form: input.form ?? "tablet",
    servingsPerDay: 1,
    unitsPerServing: 1,
    totalUnits: input.totalUnits,
    totalDays: input.totalUnits,
    confidence: input.confidence ?? "B",
    status: "rankable",
    identitySourceId: `${input.id}-official`,
    labelSourceId: input.labelSourceId,
  };
}

export const products: Product[] = [
  createProduct({
    id: "centrum-men-50",
    officialName: "센트룸 포맨 50정",
    brand: "센트룸",
    manufacturer: "PFIZER BIOTECH CORPORATION",
    reportNo: "19TW52996G2",
    totalUnits: 50,
    labelSourceId: "centrum-men-evidence",
  }),
  createProduct({
    id: "centrum-women-112",
    officialName: "센트룸 우먼 112정",
    brand: "센트룸",
    manufacturer: "PFIZER BIOTECH CORPORATION",
    reportNo: "23TW01461G0",
    totalUnits: 112,
    labelSourceId: "centrum-women-label",
  }),
  createProduct({
    id: "centrum-silver-men-112",
    officialName: "센트룸 실버맨 112정",
    brand: "센트룸",
    manufacturer: "PFIZER BIOTECH CORPORATION",
    reportNo: "24TW00184G6",
    totalUnits: 112,
    labelSourceId: "centrum-silver-men-evidence",
  }),
  createProduct({
    id: "centrum-silver-women-50",
    officialName: "센트룸 실버 우먼 50정",
    brand: "센트룸",
    manufacturer: "PFIZER BIOTECH CORPORATION",
    reportNo: "22TW51172G7",
    totalUnits: 50,
    labelSourceId: "centrum-silver-women-evidence",
  }),
  createProduct({
    id: "alive-men-60",
    officialName: "얼라이브 원스데일리 포 맨 60정",
    brand: "얼라이브",
    manufacturer: "SCHWABE NORTH AMERICA INC.",
    reportNo: "23US18612G5",
    totalUnits: 60,
    labelSourceId: "alive-men-label",
  }),
  createProduct({
    id: "alive-women-80",
    officialName: "얼라이브 원스데일리 포 우먼 80정",
    brand: "얼라이브",
    manufacturer: "SCHWABE NORTH AMERICA INC.",
    reportNo: "23US25748G0",
    totalUnits: 80,
    labelSourceId: "alive-women-evidence",
  }),
  createProduct({
    id: "alive-50-plus-60",
    officialName: "얼라이브 원스데일리 50+ 60정",
    brand: "얼라이브",
    manufacturer: "SCHWABE NORTH AMERICA INC.",
    reportNo: "24US00340G5",
    totalUnits: 60,
    labelSourceId: "alive-50-evidence",
  }),
  createProduct({
    id: "alive-milk-thistle-60",
    officialName: "얼라이브 원스데일리 + 밀크씨슬 60정",
    brand: "얼라이브",
    manufacturer: "SCHWABE NORTH AMERICA INC.",
    reportNo: "24US01938G7",
    totalUnits: 60,
    labelSourceId: "alive-milk-label",
  }),
  createProduct({
    id: "berocca-30",
    officialName: "베로카 멀티비타민 발포정 30정",
    brand: "베로카",
    manufacturer: "PT BAYER INDONESIA",
    reportNo: "24ID00098G0",
    totalUnits: 30,
    labelSourceId: "berocca-label",
    confidence: "A",
  }),
  createProduct({
    id: "acebiome-multivitamin-60",
    officialName: "에이스바이옴 멀티비타민 60정",
    brand: "에이스바이옴",
    manufacturer: "(주)서흥",
    reportNo: "200400200061952",
    totalUnits: 60,
    labelSourceId: "acebiome-evidence",
  }),
];
