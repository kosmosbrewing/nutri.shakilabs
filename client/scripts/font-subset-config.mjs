import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

// 히어로 수치가 만들어낼 수 있는 문자. 카운트업 중간 프레임과 입력에 따라 바뀌는
// 자릿수(`,`가 생겼다 없어진다)는 렌더 한 장에 다 나오지 않아 따로 합친다.
export const NUMERAL_CHARACTERS =
  "0123456789,.%+-~/()\u00B7 원억만천조년월일개회건세명점배급시간분초";

// 브랜드 폰트 문자셋 = 빌드 산출물에서 GmarketSans로 그려지는 텍스트 ∪ 위 숫자셋.
// scripts/collect-brand-charset.mjs가 dist에서 만들고 --check가 빌드마다 대조한다.
// 소스 grep은 폐기했다 — .vue를 훑으면 주석·속성·문자열까지 세어 465자/64KB가 됐고,
// 화면에 없는 글자를 배송하고 있었다(docs/BRAND_FONT_SUBSET.md §3).
const brandCharacters = JSON.parse(
  readFileSync(resolve(scriptRoot, "brand-charset.json"), "utf8")
).characters;

// 제목(font-brand)과 히어로 수치에 쓰는 브랜드 폰트.
// 플래그는 --no-hinting 하나뿐이다(레시피 §4) — `--layout-features=''`를 넣으면
// 커널링(GPOS)이 날아간다. 산출물은 이 플래그로도 재현 가능하다(같은 입력 = 같은 sha256).
export const brandFontJob = {
  source: resolve(clientRoot, "fonts/source/GmarketSansBold.woff2"),
  output: resolve(clientRoot, "public/fonts/GmarketSansBold-brand-v1.woff2"),
  publicName: "GmarketSansBold-brand-v1.woff2",
  characters: brandCharacters,
  subsetArguments: ["--no-hinting"],
};

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
  brandFontJob,
];

export const shippedFontBudgets = [
  { publicName: "Pretendard-Regular-subset.woff2", maxBytes: 64 * 1024 },
  { publicName: "Pretendard-SemiBold-subset.woff2", maxBytes: 64 * 1024 },
  // 레시피 §4 예산. 렌더 실측 문자셋이라 실제로는 그 절반도 안 쓴다 —
  // 64KB였을 때는 소스 grep 과대 수집(465자)을 그대로 통과시키는 예산이었다.
  { publicName: "GmarketSansBold-brand-v1.woff2", maxBytes: 24 * 1024 },
];

const textExtensions = new Set([
  ".css", ".html", ".js", ".json", ".svg", ".ts", ".txt", ".vue", ".xml",
]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "index.html"),
  resolve(clientRoot, "public"),
  // 공유 UI 패키지에도 화면에 찍히는 한글이 있다(푸터 서비스 목록 등) — 빠지면 두부 글자.
  // 여긴 Pretendard(UI 전체) 문자셋이다. 브랜드 폰트는 이 스캔과 무관하게
  // 렌더 실측 문자셋(brand-charset.json)을 쓴다.
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

