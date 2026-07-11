import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  foodSafetyKeySchema,
  foodSafetyServiceSchema,
  parseFoodSafetyEnvelope,
} from "./food-safety-schema.mjs";

const keyResult = foodSafetyKeySchema.safeParse(process.env.KR_FOOD_DAT);
if (!keyResult.success) {
  throw new Error("KR_FOOD_DAT is missing or malformed; load the profile without printing the key");
}

const apiBase = "https://openapi.foodsafetykorea.go.kr/api";
const services = foodSafetyServiceSchema.array().length(2).parse(["I0030", "C003"]);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, "../../data");
const pageSize = 1_000;

class RetryableFoodSafetyError extends Error {}

async function requestPage(serviceId, start, end) {
  const url = `${apiBase}/${keyResult.data}/${serviceId}/json/${start}/${end}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "nutri.shakilabs/0.1" },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new RetryableFoodSafetyError(`FoodSafety ${serviceId} network request failed`);
  }
  if (!response.ok) {
    const ErrorType = response.status >= 500 ? RetryableFoodSafetyError : Error;
    throw new ErrorType(`FoodSafety ${serviceId} request failed: HTTP ${response.status}`);
  }
  const text = await response.text();
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    if (text.includes("인증키가 유효하지 않습니다")) {
      throw new Error(`FoodSafety ${serviceId} rejected KR_FOOD_DAT; confirm key activation and service access`);
    }
    throw new Error(`FoodSafety ${serviceId} returned a non-JSON response`);
  }
  return parseFoodSafetyEnvelope(serviceId, input);
}

async function fetchPage(serviceId, start, end) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const payload = await requestPage(serviceId, start, end);
      if (payload.RESULT.CODE === "ERROR-500") {
        throw new RetryableFoodSafetyError(`FoodSafety ${serviceId} is temporarily unavailable`);
      }
      if (payload.RESULT.CODE === "INFO-100") {
        throw new Error(`FoodSafety ${serviceId} rejected KR_FOOD_DAT; confirm key activation and service access`);
      }
      if (!new Set(["INFO-000", "INFO-200"]).has(payload.RESULT.CODE)) {
        throw new Error(`FoodSafety ${serviceId} failed: ${payload.RESULT.CODE} ${payload.RESULT.MSG}`);
      }
      return payload;
    } catch (error) {
      if (!(error instanceof RetryableFoodSafetyError) || attempt === 3) throw error;
      lastError = error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500 * (2 ** attempt)));
    }
  }
  throw lastError ?? new Error(`FoodSafety ${serviceId} failed without a response`);
}

async function fetchService(serviceId) {
  const first = await fetchPage(serviceId, 1, 1);
  if (first.total_count === 0) return [];
  const records = [];
  for (let start = 1; start <= first.total_count; start += pageSize) {
    const end = Math.min(start + pageSize - 1, first.total_count);
    const page = await fetchPage(serviceId, start, end);
    records.push(...(page.row ?? []));
  }
  if (records.length !== first.total_count) {
    throw new Error(`FoodSafety ${serviceId} row mismatch: ${records.length}/${first.total_count}`);
  }
  return records;
}

async function atomicWrite(target, contents) {
  const stagingRoot = resolve(dataRoot, ".staging");
  await mkdir(dirname(target), { recursive: true });
  await mkdir(stagingRoot, { recursive: true });
  const temporary = resolve(stagingRoot, `${Date.now()}-${target.split("/").at(-1)}`);
  await writeFile(temporary, contents, "utf8");
  await rename(temporary, target);
}

const downloadedAt = new Date().toISOString();
const dataReferenceDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const manifestServices = [];

for (const serviceId of services) {
  const records = await fetchService(serviceId);
  const snapshot = { serviceId, downloadedAt, records };
  const contents = `${JSON.stringify(snapshot, null, 2)}\n`;
  const rawFile = `raw/food-safety-${serviceId}-${dataReferenceDate}.json`;
  const sha256 = createHash("sha256").update(contents).digest("hex");
  await atomicWrite(resolve(dataRoot, rawFile), contents);
  manifestServices.push({
    serviceId,
    sourceUrl: `https://www.foodsafetykorea.go.kr/api/openApiInfo.do?svc_no=${serviceId}`,
    rawFile,
    sha256,
    rowCount: records.length,
  });
  process.stdout.write(`Saved FoodSafety ${serviceId}: ${records.length} rows (${sha256.slice(0, 12)}).\n`);
}

const manifest = {
  schemaVersion: "food-safety-snapshot-v1",
  downloadedAt,
  dataReferenceDate,
  services: manifestServices,
};
await atomicWrite(
  resolve(dataRoot, "manifests/food-safety-latest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
