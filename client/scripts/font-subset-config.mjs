import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

export const fontJobs = [
  {
    source: resolve(clientRoot, "fonts/source/Pretendard-Regular.woff2"),
    output: resolve(clientRoot, "public/fonts/Pretendard-Regular-subset.woff2"),
    publicName: "Pretendard-Regular-subset.woff2",
  },
  {
    source: resolve(clientRoot, "fonts/source/Pretendard-SemiBold.woff2"),
    output: resolve(clientRoot, "public/fonts/Pretendard-SemiBold-subset.woff2"),
    publicName: "Pretendard-SemiBold-subset.woff2",
  },
  {
    source: resolve(clientRoot, "fonts/source/GmarketSansBold.woff2"),
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-subset-v2.woff2"),
    publicName: "GmarketSansBold-subset-v2.woff2",
  },
];

export const shippedFontBudgets = [
  { publicName: "Pretendard-Regular-subset.woff2", maxBytes: 48 * 1024 },
  { publicName: "Pretendard-SemiBold-subset.woff2", maxBytes: 48 * 1024 },
  { publicName: "GmarketSansBold-subset-v2.woff2", maxBytes: 64 * 1024 },
];

const textExtensions = new Set([
  ".css", ".html", ".json", ".svg", ".ts", ".txt", ".vue", ".xml",
]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "index.html"),
  resolve(clientRoot, "public"),
];

function listTextFiles(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? listTextFiles(child) : [child];
  });
}

export function collectFontCharacters() {
  const characters = new Set();
  for (const path of contentRoots.flatMap(listTextFiles)) {
    if (!textExtensions.has(extname(path))) continue;
    for (const character of readFileSync(path, "utf8")) characters.add(character);
  }
  return [...characters].sort().join("");
}
