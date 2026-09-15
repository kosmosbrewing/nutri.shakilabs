// 브랜드 폰트(GmarketSans) 문자셋 수집·검증 — docs/BRAND_FONT_SUBSET.md §3·§6
//
// 왜 소스 grep이 아니라 빌드 산출물인가: 이 앱의 옛 스캐너는 .vue 전체를 훑어
// 465자(64KB)를 모았다 — 주석을 제외해도 속성·문자열·화면에 없는 라벨이 그대로 들어간다.
// 이 앱은 vite-ssg라 dist/*.html이 곧 최종 DOM이다 — 거기서 GmarketSans로 그려지는
// 요소만 센다. 브랜드 폰트는 이 앱에서 h1뿐 아니라 h2·h3·순위 뱃지·수치에도 붙는다.
//
// 왜 요소의 "직속 텍스트"만 세는가: 조상 요소를 세면 다른 폰트로 그려지는 자손
// 텍스트까지 딸려 들어와 서브셋이 부푼다. 아이콘 + 텍스트로 된 제목(h2 안에 svg)이
// 있어 "리프 요소"만으로는 반대로 빠뜨린다 — 그래서 기준은 리프가 아니라 직속 텍스트다.
//
// 왜 브라우저를 안 쓰는가: 이 앱엔 playwright가 없고 SSR HTML이 이미 최종 DOM이라
// 클래스 해석으로 같은 답이 나온다(브라우저 실측 대조 결과는 커밋 메시지에 있다).
// 폰트를 바꾸는 클래스는 빌드된 CSS에서 역산한다 — 클래스가 새로 생겨도 놓치지 않고,
// 해석할 수 없는 선택자를 만나면 조용히 넘기지 않고 실패한다.
//
// 판정에 document.fonts.check()를 쓰지 마라 — 이 환경 Chromium에서 무엇을 물어도
// true라(뷁·Ω 포함) 실패할 수 없는 게이트가 된다. 판정 근거는 fontTools가 산출물의
// cmap을 읽어 매니페스트에 적어 둔 "실제로 담긴 글자" 전수 대조다(subset-fonts.mjs).
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NUMERAL_CHARACTERS, brandFontJob } from "./font-subset-config.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const charsetPath = resolve(scriptRoot, "brand-charset.json");
const checkOnly = process.argv.includes("--check");

// 닫는 태그가 없는 요소들. 스택에 쌓으면 그 뒤 문서 전체가 그 요소의 자손이 된다.
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function listFiles(dir, extension) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(dir, entry.name);
    if (entry.isDirectory()) return listFiles(child, extension);
    return extname(child) === extension ? [child] : [];
  });
}

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body.startsWith("#x") || body.startsWith("#X")) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number(body.slice(1)));
    return NAMED_ENTITIES[body] ?? whole;
  });
}

// 빌드된 CSS에서 "이 클래스가 붙으면 GmarketSans" / "붙으면 다른 폰트"를 역산한다.
function readFontFamilyClasses() {
  const css = listFiles(resolve(distRoot, "assets"), ".css").map((file) => readFileSync(file, "utf8")).join("\n");
  // @shakilabs/ui는 폰트를 변수로 흘린다(--sh-font-display). 그 변수가 GmarketSans로
  // 정의돼 있는지까지 확인해야 var(...)를 브랜드로 볼 수 있다.
  const displayVariableIsBrand = /--sh-font-display:\s*[^;]*GmarketSans/.test(css);
  const brand = new Set();
  const reset = new Set();
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim();
    if (selector.includes("@")) continue;
    const declaration = /(?:^|;)\s*font-family\s*:\s*([^;]+)/.exec(rule[2]);
    if (!declaration) continue;
    const value = declaration[1];
    const isBrand = value.includes("GmarketSans")
      || (displayVariableIsBrand && value.includes("--sh-font-display"));
    for (const part of selector.split(",")) {
      const simple = part.trim();
      const asClass = /^\.([A-Za-z0-9_-]+)$/.exec(simple);
      if (asClass) {
        (isBrand ? brand : reset).add(asClass[1]);
        continue;
      }
      // 브랜드 규칙을 해석 못 하면 조용히 넘기지 않는다 — 그 순간 게이트가 눈이 먼다.
      assert(!isBrand, `Unsupported GmarketSans selector in built CSS: ${simple}`);
    }
  }
  assert(brand.size > 0, "Built CSS declares no GmarketSans class");
  return { brand, reset };
}

// 요소별 직속 텍스트를 모은다. 폰트는 "가장 가까운 폰트 지정 클래스"가 이긴다.
function collectBrandText(html, classes) {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  const stack = [false];
  const texts = [];
  let cursor = 0;
  for (const tag of body.matchAll(/<(\/)?([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g)) {
    const text = body.slice(cursor, tag.index);
    cursor = tag.index + tag[0].length;
    if (stack[stack.length - 1] && text.trim()) texts.push(decodeEntities(text));
    const [, closing, rawName, attributes, selfClosing] = tag;
    const name = rawName.toLowerCase();
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (VOID_ELEMENTS.has(name) || selfClosing) continue;
    const classAttribute = /\sclass\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attributes);
    const names = (classAttribute?.[2] ?? classAttribute?.[3] ?? "").split(/\s+/).filter(Boolean);
    let brandState = stack[stack.length - 1];
    if (names.some((value) => classes.brand.has(value))) brandState = true;
    else if (names.some((value) => classes.reset.has(value))) brandState = false;
    stack.push(brandState);
  }
  return texts;
}

const classes = readFontFamilyClasses();
const pages = listFiles(distRoot, ".html");
assert(pages.length > 0, "No built HTML found; run npm run build first");
const rendered = new Set();
let elementCount = 0;
for (const page of pages) {
  for (const text of collectBrandText(readFileSync(page, "utf8"), classes)) {
    elementCount += 1;
    for (const character of text) if (!"\n\r\t".includes(character)) rendered.add(character);
  }
}
// 카운트업 중간 프레임과 입력에 따라 바뀌는 수치는 렌더 한 장에 다 나오지 않는다.
for (const character of NUMERAL_CHARACTERS) rendered.add(character);
const characters = [...rendered].sort().join("");

const scanLabel = `${pages.length} built pages, ${elementCount} text runs`;

if (!checkOnly) {
  writeFileSync(charsetPath, `${JSON.stringify({
    note: "scripts/collect-brand-charset.mjs가 dist 렌더 결과에서 만든다. 손으로 고치지 마라.",
    routes: pages.length,
    textNodes: elementCount,
    characterCount: [...characters].length,
    characters,
  }, null, 2)}\n`);
  console.log(`Collected ${[...characters].length} brand characters from ${pages.length} built pages.`);
} else {
  const committed = JSON.parse(readFileSync(charsetPath, "utf8"));
  assert(committed.characters === characters,
    "Rendered brand characters changed; run node scripts/collect-brand-charset.mjs && npm run fonts:subset");
  // 서브셋에 실제로 들어간 글리프 목록은 생성 시점에 fontTools가 산출물에서 읽어
  // 매니페스트에 적는다(scripts/subset-fonts.mjs). 여기서 다시 파이썬을 부르지 않는 이유:
  // 이 검사는 `npm run build`에 얹혀 Vercel·CI에서도 도는데 그쪽엔 fontTools가 없다.
  // 매니페스트↔파일은 verify-fonts의 sha256이, 매니페스트↔문자셋은 아래 대조가 묶는다.
  const manifest = JSON.parse(readFileSync(resolve(scriptRoot, "font-subset-manifest.json"), "utf8"));
  const brandEntry = manifest.fonts.find((font) => font.publicName === brandFontJob.publicName);
  assert(brandEntry, `Font manifest has no entry for ${brandFontJob.publicName}`);
  const shipped = new Set(brandEntry.shippedCharacters ?? "");
  // 원본 폰트에 글리프가 없는 문자(이모지 등)는 서브셋에 담길 수 없다. 글리프 단위
  // 폴백이 정상 동작이라 통과시키되, 조용히 넘기지 않고 이름을 찍는다.
  const dropped = new Set(brandEntry.droppedCharacters ?? "");
  const missing = [...characters].filter((character) =>
    !shipped.has(character) && !dropped.has(character));
  assert(missing.length === 0,
    `Brand subset misses ${missing.length} rendered characters: ${JSON.stringify(missing.join(""))}`);
  const shippedFile = resolve(distRoot, "fonts", brandFontJob.publicName);
  assert(existsSync(shippedFile), `Missing shipped brand font: ${brandFontJob.publicName}`);
  console.log(`Brand font covers ${shipped.size} rendered characters, 0 missing`
    + `${dropped.size ? ` (${JSON.stringify([...dropped].join(""))} absent from the source font: per-glyph fallback)` : ""}`
    + `, ${scanLabel}.`);
}
