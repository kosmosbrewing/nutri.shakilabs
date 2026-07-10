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
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-subset-v3.woff2"),
    publicName: "GmarketSansBold-subset-v3.woff2",
    scope: "brand",
  },
];

export const shippedFontBudgets = [
  { publicName: "Pretendard-Regular-subset.woff2", maxBytes: 48 * 1024 },
  { publicName: "Pretendard-SemiBold-subset.woff2", maxBytes: 48 * 1024 },
  { publicName: "GmarketSansBold-subset-v3.woff2", maxBytes: 64 * 1024 },
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

function collectCharacters({ includeJson, paths = contentRoots.flatMap(listTextFiles) }) {
  const characters = new Set();
  for (const path of paths) {
    if (!textExtensions.has(extname(path))) continue;
    if (!includeJson && extname(path) === ".json") continue;
    for (const character of readFileSync(path, "utf8")) characters.add(character);
  }
  return [...characters].sort().join("");
}

export function collectFontCharacters() {
  return collectCharacters({ includeJson: true });
}

export function collectBrandFontCharacters() {
  const categoryNames = "비타민D프로바이오틱스비타민C오메가3마그네슘칼슘MSM코엔자임Q10밀크씨슬";
  const productPath = resolve(clientRoot, "src/data/products.ts");
  const brandPaths = listTextFiles(resolve(clientRoot, "src"))
    .filter((path) => extname(path) === ".vue" || path === productPath);
  return [...new Set(`${collectCharacters({ includeJson: false, paths: brandPaths })}${categoryNames}`)]
    .sort()
    .join("");
}
