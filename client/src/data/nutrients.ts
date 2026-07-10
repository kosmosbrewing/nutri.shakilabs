import type { NutrientReference } from "./types";

export const TARGET_SOURCE_ID = "mfds-daily-reference";

export const nutrientReferences = [
  ["vitamin-a", "비타민 A", "ug", 700],
  ["vitamin-d", "비타민 D", "ug", 10],
  ["vitamin-e", "비타민 E", "mg", 11],
  ["vitamin-k", "비타민 K", "ug", 70],
  ["vitamin-b1", "비타민 B1", "mg", 1.2],
  ["vitamin-b2", "비타민 B2", "mg", 1.4],
  ["niacin", "나이아신", "mg", 15],
  ["pantothenic-acid", "판토텐산", "mg", 5],
  ["vitamin-b6", "비타민 B6", "mg", 1.5],
  ["biotin", "비오틴", "ug", 30],
  ["folate", "엽산", "ug", 400],
  ["vitamin-b12", "비타민 B12", "ug", 2.4],
  ["vitamin-c", "비타민 C", "mg", 100],
  ["calcium", "칼슘", "mg", 700],
  ["magnesium", "마그네슘", "mg", 315],
  ["iron", "철", "mg", 12],
  ["zinc", "아연", "mg", 8.5],
  ["copper", "구리", "mg", 0.8],
  ["selenium", "셀렌", "ug", 55],
  ["iodine", "요오드", "ug", 150],
  ["manganese", "망간", "mg", 3],
  ["chromium", "크롬", "ug", 30],
  ["molybdenum", "몰리브덴", "ug", 25],
].map(([id, name, canonicalUnit, dailyTarget], displayOrder) => ({
  id,
  name,
  canonicalUnit,
  dailyTarget,
  displayOrder,
  targetSourceId: TARGET_SOURCE_ID,
})) as NutrientReference[];

export type NutrientId = typeof nutrientReferences[number]["id"];
export type NutrientProfile = Partial<Record<NutrientId, number>>;
