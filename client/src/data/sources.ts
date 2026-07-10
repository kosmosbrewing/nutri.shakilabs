import type { ExtractionMethod, SourceEvidence, SourceType } from "./types";
import { TARGET_SOURCE_ID } from "./nutrients";

const publicRows = [
  ["centrum-men-50", "센트룸포맨(50정)", "78bb0042f865115077874a555c96df3a5f554e76807cd7e5712569ec33c6001f"],
  ["centrum-women-112", "센트룸 우먼(112정)", "30cc6464a04ae0fd216f2d25e77b1fdf96c74946af0988cbd20037c4d06cf034"],
  ["centrum-silver-men-112", "센트룸실버맨(112정)", "08fe37be609c3a2e3a37399e56e67e86b60f3ec5e0d7420670ac41d9556dddc6"],
  ["centrum-silver-women-50", "센트룸 실버 우먼(50정)", "07db30b407ad69c8e7a7296b95c2e7090e23004d893925a3b3280aa1a48813bc"],
  ["alive-men-60", "얼라이브 원스데일리 포 맨 - 60정", "b2b00bb2a324f75527e64e957daf4ea36303e01a70faa9fccaf19bbe558e4974"],
  ["alive-women-80", "얼라이브 원스데일리 포 우먼 - 80정", "b3829fcea64a2eedf6a1f486a6bf4a7ef1b486550592463c775d35719d708911"],
  ["alive-50-plus-60", "얼라이브 원스데일리 50+", "5d91685a769bfd7ddbb6e65af65fd9d94c875d195114af2f1b047790387a3a31"],
  ["alive-milk-thistle-60", "얼라이브 원스데일리 + 밀크씨슬", "86d2d32d9cb9131cb42f2dd9618a746904b252aa631ecb9478e4e5f8f13fc92d"],
  ["berocca-30", "베로카 멀티비타민 발포정 (30정)", "abf6c7ad86d0bbfd58eb2438bf2049d14a44c401d9d49a24cbab7beb92f67ecc"],
  ["acebiome-multivitamin-60", "에이스바이옴 멀티비타민", "4d6465de9d0e3f17d8d6fc5d2ec82008a67bde2deb3307ce29b139f0ae066c8c"],
];

interface SourceSpec {
  id: string;
  productId: string;
  type: SourceType;
  title: string;
  url: string;
  hash: string;
  extraction: ExtractionMethod;
  fields: string[];
}

type EvidenceRow = [string, string, SourceType, string, string, string];

const evidenceRows: EvidenceRow[] = [
  ["centrum-men-evidence", "centrum-men-50", "retailer", "다나와 센트룸 포맨 50정", "https://prod.danawa.com/info/?pcode=5824834", "8624000c1a636700459d4d9693b6c7ed72f2bea591cbb2c27f0682f114325b2d"],
  ["centrum-women-label", "centrum-women-112", "retailer", "다나와 센트룸 포 우먼 성분표", "https://prod.danawa.com/info/?pcode=65999897", "1bb02c7c6e76972f1d5757d22d48f8c6004eea124c0146380d9f7b25adf6e6e9"],
  ["centrum-women-price", "centrum-women-112", "retailer", "다나와 센트룸 우먼 112정 가격", "https://prod.danawa.com/info/?pcode=109990749", "48fe01dadffeee5ed30e1194fee244402f6dec219a9de9cc9778fef7de6fb362"],
  ["centrum-silver-men-evidence", "centrum-silver-men-112", "retailer", "다나와 센트룸 실버맨 112정", "https://prod.danawa.com/info/?pcode=5979054", "477c3b8d78763805a532d669de16fa621906037d0d3054b6826d43e1a2aa9986"],
  ["centrum-silver-women-evidence", "centrum-silver-women-50", "retailer", "다나와 센트룸 실버 우먼 50정", "https://prod.danawa.com/info/?pcode=5825000", "bdbc46abef36f5d0ecfac35f253017003c3bbdeb2bfdbd7047aa642d452b739a"],
  ["alive-men-label", "alive-men-60", "retailer", "SSG 얼라이브 포 맨 영양정보", "https://www.ssg.com/item/itemView.ssg?itemId=1000010266770", "e7f033c26336dbc0328a6da3d66267308d50cf3365e4eba34df64c253c9bb74f"],
  ["alive-men-price", "alive-men-60", "retailer", "올리브영 얼라이브 포 맨 60정 가격", "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000144906", "e32ed3a26af5817cf5b4d65102af9e1ba96ab10d1994b9ed829039bbfe6a7120"],
  ["alive-women-evidence", "alive-women-80", "retailer", "다나와 얼라이브 포 우먼 80정", "https://prod.danawa.com/info/?pcode=29239046", "56fb2bdccb89e61e5a6370a5010bd02aba9c8c11f61e0ef7a4f3ec28326cc9fe"],
  ["alive-50-evidence", "alive-50-plus-60", "retailer", "다나와 얼라이브 50+ 60정", "https://prod.danawa.com/info/?pcode=15515066", "c4f14fb3fb9e2ef2fbc364a94c5f4827ade75b1d18d0200dbd59ceceeaeef30a"],
  ["alive-milk-label", "alive-milk-thistle-60", "retailer", "다나와 얼라이브 밀크씨슬 성분표", "https://prod.danawa.com/info/?pcode=14844986", "7cd597910cb3afd78b6286a7c1396713c700244baca55cab55a9f7caa9c9f538"],
  ["alive-milk-price", "alive-milk-thistle-60", "retailer", "SSG 얼라이브 밀크씨슬 2병 가격", "https://www.ssg.com/item/itemView.ssg?itemId=1000549013753", "c3a522339357fa45fe5d80bcb96e72525ff642565a2f67dbcc6f236c9bc10a70"],
  ["berocca-label", "berocca-30", "manufacturer_label", "바이엘 베로카 제품정보 PDF", "https://www.bayer.com/sites/default/files/2025-07/pi-berocca-20250630.pdf", "7db0b00614e37a51a546c4b8b3619ceff948700ca6a57f41d3093dbdbd5161f6"],
  ["berocca-price", "berocca-30", "retailer", "다나와 베로카 30정 가격", "https://prod.danawa.com/info/?pcode=119684681", "bc786da04bf82f128229c6c9333984bbe20f43716a1311e224a671f9a10fa688"],
  ["acebiome-evidence", "acebiome-multivitamin-60", "retailer", "다나와 에이스바이옴 60정", "https://prod.danawa.com/info/?pcode=79073921", "1313479d9244b37467e14feccc78f0f1e34ab4fc2ae742c3ee03575f36542478"],
];

const evidenceSpecs: SourceSpec[] = evidenceRows.map(([id, productId, type, title, url, hash]) => ({
  id, productId, type, title, url, hash, extraction: "text", fields: ["nutrients", "package", "price", "shipping"],
}));

const publicSources: SourceEvidence[] = publicRows.map(([productId, title, hash]) => ({
  id: `${productId}-official`, productId, type: "public_api",
  title: `식약처 건강기능식품 영양성분: ${title}`,
  url: "https://www.data.go.kr/data/15155983/standard.do",
  verifiedAt: "2026-07-10", rawHash: `sha256:${hash}`, extraction: "api",
  fields: ["officialName", "reportNo", "manufacturer", "serving"],
}));

const evidenceSources: SourceEvidence[] = evidenceSpecs.map((source) => ({
  id: source.id, productId: source.productId, type: source.type, title: source.title,
  url: source.url, verifiedAt: "2026-07-10", rawHash: `sha256:${source.hash}`,
  extraction: source.extraction, fields: source.fields,
}));

export const sources: SourceEvidence[] = [{
  id: TARGET_SOURCE_ID, productId: null, type: "public_api",
  title: "식품의약품안전처 1일 영양성분 기준치",
  url: "https://www.foodsafetykorea.go.kr/upload/mkisna/2017.pdf",
  verifiedAt: "2026-07-10",
  rawHash: "sha256:4ae656a0cca423409f0c00987d94731c5ecbd363edd142b922a17f8f3e422052",
  extraction: "manual", fields: ["dailyTarget", "canonicalUnit"],
}, ...publicSources, ...evidenceSources];
