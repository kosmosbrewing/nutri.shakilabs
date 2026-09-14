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
  { publicName: "Pretendard-Regular-subset.woff2", maxBytes: 64 * 1024 },
  { publicName: "Pretendard-SemiBold-subset.woff2", maxBytes: 64 * 1024 },
  { publicName: "GmarketSansBold-subset-v3.woff2", maxBytes: 64 * 1024 },
];

const textExtensions = new Set([
  ".css", ".html", ".js", ".json", ".svg", ".ts", ".txt", ".vue", ".xml",
]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "index.html"),
  resolve(clientRoot, "public"),
  // 공유 UI 패키지에도 화면에 찍히는 한글이 있다(푸터 서비스 목록 등) — 빠지면 두부 글자.
  // 브랜드 폰트(GmarketSans)는 .vue만 스캔하므로 예산에 영향 없음
  resolve(clientRoot, "node_modules/@shakilabs/ui/dist/index.js"),
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

// 브랜드 폰트는 화면에 찍히는 글자만 필요하다. 주석은 렌더되지 않는데도 스캐너가
// 삼켜서 서브셋을 부풀린다(BL-020 작업에서 한글 주석 몇 줄에 +3.2KB, 64KB 예산 초과).
// `//` 는 줄 전체가 주석일 때만 지운다 — 문자열 안의 "https://" 를 잘라내면
// 그 줄 뒤쪽 한글이 통째로 사라진다.
function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

export function collectBrandFontCharacters() {
  const categoryNames = "비타민D프로바이오틱스비타민C오메가3마그네슘칼슘MSM코엔자임Q10밀크씨슬";
  const productPath = resolve(clientRoot, "src/data/products.ts");
  const brandPaths = listTextFiles(resolve(clientRoot, "src"))
    .filter((path) => extname(path) === ".vue" || path === productPath);
  const characters = new Set();
  for (const path of brandPaths) {
    for (const character of stripComments(readFileSync(path, "utf8"))) characters.add(character);
  }
  for (const character of categoryNames) characters.add(character);
  return [...characters].sort().join("");
}
