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

// 테스트 픽스처는 화면에 찍히지 않는다 — 주석과 같은 이유로 문자셋에서 뺀다.
// (이 규칙이 없으면 폰트 게이트 테스트가 쓰는 한글이 그대로 폰트에 실린다.)
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]s$/;

function listTextFiles(path) {
  if (!statSync(path).isDirectory()) return TEST_FILE_PATTERN.test(path) ? [] : [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? listTextFiles(child) : listTextFiles(child);
  });
}

// 주석은 화면에 찍히지 않는데도 문자셋에 들어와 예산과 해시 게이트를 흔든다
// (이번 주에만 2회: 브랜드 472→502자로 64KB 초과, UI 845→852자로 해시 red).
// 위험한 쪽은 과대 수집이 아니라 **과소 수집**이다 — `//` 뒤를 무작정 자르면
// 텍스트 노드의 `https://` 뒤에 있는 한글까지 사라진다. 그래서 문자열·템플릿
// 리터럴을 추적하는 스캐너를 쓰고, .vue는 블록별로 문법을 갈라 적용한다.
const COMMENT_SYNTAX = {
  // CSS에 `//` 주석은 없다. url(//cdn...)을 자르지 않으려면 블록 주석만 봐야 한다.
  css: { line: false, block: true, html: false },
  js: { line: true, block: true, html: false },
  // 템플릿·마크업의 `//`는 주석이 아니라 URL이다
  markup: { line: false, block: false, html: true },
  none: { line: false, block: false, html: false },
};

const EXTENSION_SYNTAX = {
  ".css": COMMENT_SYNTAX.css,
  ".js": COMMENT_SYNTAX.js,
  ".ts": COMMENT_SYNTAX.js,
  ".mjs": COMMENT_SYNTAX.js,
  ".html": COMMENT_SYNTAX.markup,
  ".svg": COMMENT_SYNTAX.markup,
  ".xml": COMMENT_SYNTAX.markup,
  ".json": COMMENT_SYNTAX.none,
  ".txt": COMMENT_SYNTAX.none,
};

/**
 * 주석만 빼고 원문을 되돌린다. 문자 집합만 쓰므로 위치·공백은 보존하지 않는다.
 * 문자열/템플릿 리터럴 안에서는 어떤 주석 토큰도 열지 않는다 — 과소 수집 방지.
 */
function stripComments(source, syntax) {
  if (!syntax.line && !syntax.block && !syntax.html) return source;

  let out = "";
  let index = 0;
  const length = source.length;

  while (index < length) {
    const character = source[index];

    // 문자열·템플릿 리터럴은 통째로 통과시킨다(내용에 한글이 있을 수 있다)
    if (character === "'" || character === '"' || character === "`") {
      const quote = character;
      out += character;
      index += 1;
      while (index < length) {
        const inner = source[index];
        if (inner === "\\") {
          out += source.slice(index, index + 2);
          index += 2;
          continue;
        }
        out += inner;
        index += 1;
        if (inner === quote) break;
      }
      continue;
    }

    if (syntax.html && source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      index = end === -1 ? length : end + 3;
      continue;
    }

    if (syntax.block && source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? length : end + 2;
      continue;
    }

    if (syntax.line && source.startsWith("//", index)) {
      const end = source.indexOf("\n", index + 2);
      index = end === -1 ? length : end;
      continue;
    }

    out += character;
    index += 1;
  }

  return out;
}

// .vue 한 파일 안에 세 문법이 공존한다. 템플릿의 `https://`를 JS 규칙으로 자르면
// 그 줄 뒤의 한글이 통째로 사라지므로 블록 경계를 실제로 갈라야 한다.
const VUE_BLOCK_PATTERN = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi;

function stripVueComments(source) {
  let out = "";
  let cursor = 0;
  for (const match of source.matchAll(VUE_BLOCK_PATTERN)) {
    const start = match.index ?? 0;
    out += stripComments(source.slice(cursor, start), COMMENT_SYNTAX.markup);
    const syntax = match[1].toLowerCase() === "style" ? COMMENT_SYNTAX.css : COMMENT_SYNTAX.js;
    out += stripComments(match[2], syntax);
    cursor = start + match[0].length;
  }
  out += stripComments(source.slice(cursor), COMMENT_SYNTAX.markup);
  return out;
}

/** 확장자별 주석 규칙을 적용한다. 테스트가 이 경계를 직접 찌른다. */
export function stripSourceComments(source, extension) {
  if (extension === ".vue") return stripVueComments(source);
  return stripComments(source, EXTENSION_SYNTAX[extension] ?? COMMENT_SYNTAX.none);
}

function readContentText(path) {
  return stripSourceComments(readFileSync(path, "utf8"), extname(path));
}

function collectCharacters({ includeJson, paths = contentRoots.flatMap(listTextFiles) }) {
  const characters = new Set();
  for (const path of paths) {
    if (!textExtensions.has(extname(path))) continue;
    if (!includeJson && extname(path) === ".json") continue;
    for (const character of readContentText(path)) characters.add(character);
  }
  return [...characters].sort().join("");
}

export function collectFontCharacters() {
  return collectCharacters({ includeJson: true });
}

