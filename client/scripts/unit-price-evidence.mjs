import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const categorySchema = z.enum([
  "probiotics",
  "omega-3",
  "magnesium",
  "msm",
  "coenzyme-q10",
  "milk-thistle",
  "vitamin-d",
  "vitamin-c",
  "calcium",
]);

export const evidenceTargetSchema = z.object({
  productId: idSchema,
  categorySlug: categorySchema,
  ledgerNo: z.string().regex(/^\d+$/),
  reportNo: z.string().trim().min(1),
}).strict();

export const evidenceTargetsSchema = z.object({
  schemaVersion: z.literal("unit-price-evidence-target-v1"),
  targets: z.array(evidenceTargetSchema).min(18).max(60),
}).strict();

const evidenceProductSchema = evidenceTargetSchema.extend({
  manufacturer: z.string().trim().min(1),
  officialName: z.string().trim().min(1),
  intakeText: z.string().trim().min(1),
  standardText: z.string().trim().min(1),
}).strict();

export const unitPriceEvidenceSchema = z.object({
  schemaVersion: z.literal("unit-price-evidence-v1"),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceUrl: z.url(),
  products: z.array(evidenceProductSchema).min(18).max(60),
}).strict();

const activeLabels = {
  probiotics: /프로바이오틱스\s*수/i,
  "omega-3": /EPA\s*와\s*DHA\s*의\s*합/i,
  magnesium: /마그네슘/i,
  msm: /(?:엠에스엠|MSM|디메틸설폰)/i,
  "coenzyme-q10": /코엔자임\s*Q10/i,
  "milk-thistle": /실리마린/i,
  "vitamin-d": /비타민\s*D/i,
  "vitamin-c": /비타민\s*C/i,
  calcium: /칼슘/i,
};
// 카테고리별 표시량 단위 — 비타민D는 ㎍(ug), 프로바이오틱스는 CFU, 나머지는 mg
const activeUnits = { probiotics: "CFU", "vitamin-d": "ug" };

export function extractOfficialActiveAmount(categoryInput, standardInput) {
  const category = categorySchema.parse(categoryInput);
  const standard = z.string().trim().min(1).parse(standardInput)
    .replaceAll(" ", " ")
    .replaceAll("㎎", "mg")
    .replaceAll("㎍", "ug");
  const label = standard.match(activeLabels[category]);
  if (!label || label.index === undefined) return null;
  const section = standard.slice(label.index + label[0].length, label.index + label[0].length + 180);
  const unit = activeUnits[category] ?? "mg";
  const amount = section.match(new RegExp(`(?:표시량\\s*\\()?\\s*([\\d,.]+)\\s*(?:\\([^)]*\\))?\\s*${unit}`, "i"));
  if (!amount) return null;
  const parsed = Number(amount[1].replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function extractOfficialUnitsPerDay(intakeInput) {
  const intake = z.string().trim().min(1).parse(intakeInput);
  const direct = intake.match(/1일\s*(\d+)\s*(?:정|캡슐|포)/);
  if (direct) return Number(direct[1]);
  const frequency = intake.match(/1일\s*(\d+)\s*회/);
  const units = intake.match(/1회\s*(\d+)\s*(?:정|캡슐|포)/);
  if (!frequency || !units) return null;
  const parsed = Number(frequency[1]) * Number(units[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
