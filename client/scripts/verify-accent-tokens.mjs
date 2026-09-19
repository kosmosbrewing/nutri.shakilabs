// 카테고리 액센트 + 의미색 게이트 (디자인 정리 계획 2026-09-17 §4.2·§4.3).
//
// card·nutri·baby는 "소비·생활" 그룹이고 청록 하나만 쓴다. 소스만 봐서는 판정이
// 안 된다 — 앱마다 팔레트를 선언하는 파일이 다르고(이 앱은 main.css, card는
// index.html의 인라인 critical CSS), Tailwind가 참조 없는 블록을 통째로 지운 전례가
// 있다. 그래서 증거는 빌드 산출물이다: dist/index.html + dist/assets/*.css를
// 브라우저 캐스케이드 순서로 병합해 읽고, 소스 선언과도 대조한다.
//
// 브라우저·python을 쓰지 않는다. 빌드 게이트에 크로미움을 끌어들이면 Vercel 빌드가
// 깨진다(계획서 §6-10). 대비는 스크린샷이 아니라 계산으로 판정한다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");

// 팔레트를 선언하는 소스 파일. 빌드 산출물과 양쪽 다 봐야 "선언은 있는데 배포는
// 안 되는" 상태와 "배포는 됐는데 소스가 딴 값" 두 방향을 모두 잡는다.
const SOURCE_FILES = ["src/assets/css/main.css", "index.html"];

// 그룹 팔레트. 계획서 확정 표를 그대로 옮긴 리터럴이고 앱이 재계산하지 않는다 —
// 재계산하면 "하나의 청록"이 미묘하게 다른 세 청록으로 갈라진다.
// --accent-foreground는 파생 공식값 30%가 아니라 28%다: 30%는 틴트 위 4.37:1로
// AA 미달이고 28%는 4.92:1이다. 공식보다 실측이 이긴다.
const EXPECTED = {
  light: {
    "--primary": "174 70% 24%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "174 15% 91%",
    "--secondary-foreground": "222 47% 11%",
    "--accent": "174 68% 95%",
    "--accent-foreground": "174 70% 28%",
    // focus 링은 카테고리 액센트가 아니라 잉크다(v3 §2.1 color.focus) — 액센트로 두면
    // 그룹 색이 바뀔 때마다 링도 흔들리고, 옅은 액센트 앱에서는 링이 사라진다.
    "--ring": "0 0% 3.92%",
  },
  dark: {
    "--primary": "174 70% 45%",
    "--primary-foreground": "174 70% 10%",
    "--secondary": "174 15% 20%",
    "--secondary-foreground": "210 40% 96%",
    "--accent": "174 50% 22%",
    "--accent-foreground": "174 70% 78%",
    "--ring": "0 0% 96.08%",
  },
};

// v3 §2.1 고정 의미색. hex로 대조한다 — 같은 색의 다른 HSL 표기는 통과시키고
// 다른 색은 절대 통과시키지 않는 유일한 기준이다.
const EXPECTED_STATUS = {
  light: {
    "--status-success": "#1B7A4A",
    "--status-warning": "#B45309",
    "--status-danger": "#C62828",
    "--status-info": "#1D4E8C",
  },
  dark: {
    "--status-success": "#5DCA8E",
    "--status-warning": "#F0B429",
    "--status-danger": "#F07171",
    "--status-info": "#8BB4E8",
  },
};

// 액센트 명도 밴드(계획서 §4.2). 밴드를 벗어나면 hue가 맞아도 네 그룹 색이
// 한 무게로 안 읽힌다.
const PRIMARY_L_BAND = { light: [24, 41], dark: [45, 72] };

// 이미 정본 토큰이 있는 색에 붙었던 앱 로컬 별칭들. 같은 뜻의 색이 앱마다 두 이름으로
// 배포되던 원인이라 빌드 산출물에 남아 있으면 실패다(선언과 유틸리티 클래스 양쪽).
const BANNED_PROPERTY = /^--(savings|loss|fee|profit|brand)(-|$)|^--status-caution$/;
const BANNED_CLASS = /\.\\?!?(?:text|bg|border|fill|ring|stroke|divide|outline)-(?:savings|loss|fee|profit|brand)\b/;

// v3 §2.1 기준 표면. 앱 자체 --card/--background와 함께 본다 — 앱 중성색이 흘러도
// 액센트 미달을 가리지 못하게.
const REFERENCE_SURFACES = {
  light: { "v3 card #FFFFFF": "#FFFFFF", "v3 canvas #F7F7F5": "#F7F7F5" },
  dark: { "v3 card #1C1C1C": "#1C1C1C", "v3 canvas #121212": "#121212" },
};

const AA_BODY = 4.5;
const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** selector 블록의 커스텀 프로퍼티를 소스 순서로 병합한다(뒤가 이긴다 — 캐스케이드). */
function collectTokens(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blocks = stripComments(css).matchAll(
    new RegExp(`(?:^|[\\s,{}])${escaped}\\s*\\{([^{}]*)\\}`, "g")
  );
  const tokens = {};
  for (const block of blocks) {
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      tokens[name] = value.trim().replace(/\s+/g, " ");
    }
  }
  return tokens;
}

function hslToRgb(token) {
  const [h, s, l] = String(token).split(/\s+/).map(Number.parseFloat);
  if (![h, s, l].every(Number.isFinite)) throw new Error(`Unparsable hsl token: "${token}"`);
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n) => {
    const k = (n + h / 30) % 12;
    return light - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return [channel(0), channel(8), channel(4)];
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(clean.slice(i, i + 2), 16) / 255);
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function relativeLuminance([r, g, b]) {
  const linear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a, b) {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function lightnessOf(token) {
  return Number.parseFloat(String(token).split(/\s+/)[2]);
}

function readBuiltCss() {
  const parts = [];
  const indexPath = resolve(distRoot, "index.html");
  if (existsSync(indexPath)) parts.push(readFileSync(indexPath, "utf8"));
  const assetsDir = resolve(distRoot, "assets");
  if (existsSync(assetsDir)) {
    for (const name of readdirSync(assetsDir).filter((file) => file.endsWith(".css"))) {
      parts.push(readFileSync(resolve(assetsDir, name), "utf8"));
    }
  }
  return parts.join("\n");
}

const sourceCss = SOURCE_FILES.map((file) => readFileSync(resolve(clientRoot, file), "utf8")).join("\n");
const builtCss = readBuiltCss();
check(builtCss.length > 0, "Build produced no CSS to verify");

const palettes = {
  light: { source: collectTokens(sourceCss, ":root"), built: collectTokens(builtCss, ":root") },
  dark: { source: collectTokens(sourceCss, ".dark"), built: collectTokens(builtCss, ".dark") },
};

for (const theme of ["light", "dark"]) {
  const { source, built } = palettes[theme];
  for (const [name, expected] of Object.entries(EXPECTED[theme])) {
    check(source[name] === expected,
      `source ${theme} ${name} is "${source[name] ?? "(missing)"}", expected "${expected}"`);
    check(built[name] === expected,
      `built CSS ${theme} ${name} is "${built[name] ?? "(missing)"}", expected "${expected}"`);
  }

  for (const [name, expectedHex] of Object.entries(EXPECTED_STATUS[theme])) {
    const shipped = built[name];
    check(shipped !== undefined, `built CSS ${theme} is missing ${name}`);
    if (shipped === undefined) continue;
    const actualHex = rgbToHex(hslToRgb(shipped));
    check(actualHex === expectedHex,
      `built CSS ${theme} ${name} resolves to ${actualHex}, expected v3 fixed ${expectedHex}`);
  }

  const [min, max] = PRIMARY_L_BAND[theme];
  const lightness = lightnessOf(built["--primary"] ?? "0 0% 0%");
  check(lightness >= min && lightness <= max,
    `${theme} --primary lightness ${lightness}% is outside the ${min}-${max}% band`);

  const primaryRgb = hslToRgb(built["--primary"]);
  const surfaces = { ...REFERENCE_SURFACES[theme] };
  for (const [name, value] of Object.entries({ "--card": built["--card"], "--background": built["--background"] })) {
    if (value) surfaces[name] = value;
  }
  for (const [name, value] of Object.entries(surfaces)) {
    const rgb = value.startsWith("#") ? hexToRgb(value) : hslToRgb(value);
    const ratio = contrast(primaryRgb, rgb);
    check(ratio >= AA_BODY, `${theme} --primary on ${name} is ${ratio.toFixed(2)}:1, need ${AA_BODY}:1`);
  }

  // 틴트 행. 민무늬 표면은 전부 통과해도 여기만 미달인 사례가 있었고,
  // accent-foreground를 30%에서 28%로 내린 근거도 이 한 줄이다.
  const tintRatio = contrast(hslToRgb(built["--accent-foreground"]), hslToRgb(built["--accent"]));
  check(tintRatio >= AA_BODY,
    `${theme} --accent-foreground on --accent tint is ${tintRatio.toFixed(2)}:1, need ${AA_BODY}:1`);
}

const strippedCss = stripComments(builtCss);
for (const [, name] of strippedCss.matchAll(/(--[\w-]+)\s*:/g)) {
  check(!BANNED_PROPERTY.test(name), `Built CSS still declares the local alias ${name}`);
}
const bannedClass = strippedCss.match(BANNED_CLASS);
check(!bannedClass, `Built CSS still emits the local alias utility ${bannedClass?.[0]}`);

if (failures.length > 0) {
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`);
  throw new Error(`Accent token gate failed with ${new Set(failures).size} problem(s)`);
}

const assertions = Object.keys(EXPECTED.light).length * 4 + Object.keys(EXPECTED_STATUS.light).length * 2 + 12;
console.log(`Accent tokens: teal group palette verified (${assertions} assertions, light + dark, contrast computed).`);
