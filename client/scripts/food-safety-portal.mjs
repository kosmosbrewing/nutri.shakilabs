import { z } from "zod";

const portalBase = "https://www.foodsafetykorea.go.kr";
const searchPage = `${portalBase}/portal/healthyfoodlife/searchHomeHF.do`;
const browserHeaders = {
  accept: "text/html,application/xhtml+xml",
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/138 Safari/537.36",
};
const searchRowSchema = z.object({
  prdlst_report_ledg_no: z.string().regex(/^\d+$/),
  prdlst_nm: z.string().trim().min(1),
  prms_dt: z.string().regex(/^\d{8}$/),
  prdlst_report_no: z.string().trim().min(1),
  bssh_nm: z.string().trim().min(1),
}).passthrough();
const querySchema = z.string().trim().min(2).max(120);

async function fetchWithRetry(url, options, label) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${label} failed: HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 300 * (2 ** attempt)));
    }
  }
  throw lastError;
}

function decodeHtml(input) {
  const entities = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
      if (code.startsWith("#")) {
        const radix = code[1].toLowerCase() === "x" ? 16 : 10;
        const value = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix);
        return Number.isNaN(value) ? entity : String.fromCodePoint(value);
      }
      return entities[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function field(text, label, nextLabel) {
  const start = text.indexOf(label);
  if (start < 0) throw new Error(`FoodSafety detail is missing ${label}`);
  const valueStart = start + label.length;
  const end = text.indexOf(nextLabel, valueStart);
  if (end < 0) throw new Error(`FoodSafety detail is missing ${nextLabel}`);
  return text.slice(valueStart, end).trim();
}

export function parseFoodSafetyDetailHtml(input) {
  const htmlResult = z.string().min(1).safeParse(input);
  if (!htmlResult.success) throw new Error("FoodSafety detail HTML validation failed");
  const text = decodeHtml(htmlResult.data);
  const parsed = {
    manufacturer: field(text, "업소명", "제품명"),
    officialName: field(text, "제품명", "신고번호"),
    reportNo: field(text, "신고번호", "등록일자"),
    intakeText: field(text, "섭취량/섭취 방법", "포장재질"),
    standardText: field(text, "기준 및 규격", "기능성 원재료 정보"),
  };
  return z.object({
    manufacturer: z.string().min(1),
    officialName: z.string().min(1),
    reportNo: z.string().min(1),
    intakeText: z.string().min(1),
    standardText: z.string().min(1),
  }).parse(parsed);
}

export async function createFoodSafetyPortalSession() {
  const response = await fetchWithRetry(searchPage, { headers: browserHeaders }, "FoodSafety session");
  const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  await response.text();
  return z.string().min(1).parse(cookie);
}

export async function searchFoodSafetyProducts(sessionInput, queryInput) {
  const session = z.string().min(1).parse(sessionInput);
  const query = querySchema.parse(queryInput);
  const body = new URLSearchParams({ prdlst_nm: query, bssh_nm: "", show_cnt: "100", start_idx: "1" });
  const response = await fetchWithRetry(`${portalBase}/portal/healthyfoodlife/searchHomeHFProc.do`, {
    method: "POST",
    headers: {
      ...browserHeaders,
      cookie: session,
      origin: portalBase,
      referer: searchPage,
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
    },
    body,
  }, "FoodSafety product search");
  const text = await response.text();
  if (text.includes("크롤링 제한")) throw new Error("FoodSafety product search was rate-limited");
  return searchRowSchema.array().parse(JSON.parse(text));
}

export async function fetchFoodSafetyProductDetail(sessionInput, ledgerInput) {
  const session = z.string().min(1).parse(sessionInput);
  const ledgerNo = z.string().regex(/^\d+$/).parse(ledgerInput);
  const body = new URLSearchParams({ prdlstReportLedgNo: ledgerNo });
  const response = await fetchWithRetry(`${portalBase}/portal/healthyfoodlife/searchHomeHFDetail.do`, {
    method: "POST",
    headers: {
      ...browserHeaders,
      cookie: session,
      origin: portalBase,
      referer: searchPage,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  }, "FoodSafety product detail");
  return parseFoodSafetyDetailHtml(await response.text());
}

export const foodSafetyPortalSourceUrl = searchPage;
