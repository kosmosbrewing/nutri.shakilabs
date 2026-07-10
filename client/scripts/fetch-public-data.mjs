import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseJsonResponse,
  portalHeaderSchema,
  portalRecordsSchema,
} from "./public-data-schema.mjs";

const datasetId = "15155983";
const sourceUrl = `https://www.data.go.kr/data/${datasetId}/standard.do`;
const portalBase = "https://www.data.go.kr/download";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, "../..");
const dataRoot = resolve(repositoryRoot, "data");

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "nutri.shakilabs/0.1" },
  });
  if (!response.ok) throw new Error(`${label} request failed: ${response.status}`);
  return response.json();
}

function dataUrl(header, page, perPage) {
  const url = new URL(`${portalBase}/standard.json`);
  url.searchParams.set("publicDataPk", datasetId);
  url.searchParams.set("svcTableNm", header.tableVO.svcTableNm);
  url.searchParams.set("totalCount", String(header.totalCount));
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));
  for (const field of header.tableVO.colNmList) {
    url.searchParams.append("colNmList", field);
  }
  return url;
}

async function fetchRecords(header) {
  const perPage = 10_000;
  const pageCount = Math.ceil(header.totalCount / perPage);
  const records = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const input = await fetchJson(dataUrl(header, page, perPage), `Data page ${page}`);
    const pageRecords = parseJsonResponse(portalRecordsSchema, input, `Data page ${page}`);
    records.push(...pageRecords);
  }
  if (records.length !== header.totalCount) {
    throw new Error(`Row count mismatch: expected ${header.totalCount}, received ${records.length}`);
  }
  return records;
}

function referenceDate(records) {
  const dates = records
    .map((record) => record.DATA_CRTR_YMD)
    .filter((value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
  if (dates.length === 0) throw new Error("Dataset reference date is missing");
  return dates.sort().at(-1);
}

async function atomicWrite(target, contents) {
  const staging = resolve(dataRoot, ".staging");
  await mkdir(dirname(target), { recursive: true });
  await mkdir(staging, { recursive: true });
  const temporary = resolve(staging, `${Date.now()}-${target.split("/").at(-1)}`);
  await writeFile(temporary, contents, "utf8");
  await rename(temporary, target);
}

const headerInput = await fetchJson(
  `${portalBase}/columList.json?pk=${datasetId}&ext=JSON`,
  "Dataset header",
);
const header = parseJsonResponse(portalHeaderSchema, headerInput, "Dataset header");
const records = await fetchRecords(header);
const dataReferenceDate = referenceDate(records);
const snapshot = {
  fields: header.columList.map(({ columCode, columNm }) => ({ code: columCode, name: columNm })),
  records,
};
const rawContents = `${JSON.stringify(snapshot, null, 2)}\n`;
const rawFile = `raw/health-functional-food-nutrition-${dataReferenceDate}.json`;
const sha256 = createHash("sha256").update(rawContents).digest("hex");
const manifest = {
  schemaVersion: "public-snapshot-v1",
  datasetId,
  datasetName: header.fileName,
  sourceUrl,
  downloadedAt: new Date().toISOString(),
  dataReferenceDate,
  rawFile,
  sha256,
  rowCount: records.length,
  columnCount: snapshot.fields.length,
};

await atomicWrite(resolve(dataRoot, rawFile), rawContents);
await atomicWrite(resolve(dataRoot, "manifests/latest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Saved ${manifest.rowCount} rows to ${rawFile} (${sha256.slice(0, 12)}).\n`);
