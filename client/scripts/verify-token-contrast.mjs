import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * WCAG 대비 회귀 게이트.
 *
 * 소스가 아니라 **빌드 산출물**을 읽는다. 이 앱에서 소스≠산출물이 실제로 벌어졌기 때문이다 —
 * main.css의 .dark 토큰 블록은 Tailwind 빌드에서 통째로 제거되어 dist에 존재하지 않는다.
 * 선언만 검사하면 "정의돼 있으니 통과"로 오판한다. 그래서 실제로 배포되는 :root 값을
 * 파싱해 대비비를 계산한다.
 */
const AA_BODY = 4.5;
/** WCAG 1.4.11 비텍스트 대비. 아이콘·보더처럼 글자가 아닌 것에만 쓴다. */
const AA_NON_TEXT = 3;

/** 텍스트가 실제로 얹히는 표면들. 세 표면 모두에서 본문 기준을 넘어야 한다. */
const SURFACES = ["--background", "--card", "--muted"];
const FOREGROUNDS = [
  "--foreground",
  "--muted-foreground",
  "--primary",
  "--status-success",
  "--status-warning",
  "--status-danger",
  "--status-info",
  // @shakilabs/ui가 --sh-color-danger를 여기서 끌어온다. 앱이 선언하지 않으면 패키지
  // 리터럴로 조용히 폴백해 어떤 게이트도 그 값을 보지 못한다.
  "--destructive",
];
/** 표면 위 전경이 아니라 짝으로만 쓰이는 조합. */
const PAIRS = [
  ["--primary-foreground", "--primary"],
  ["--accent-foreground", "--accent"],
  ["--secondary-foreground", "--secondary"],
  ["--destructive-foreground", "--destructive"],
];

/**
 * 솔리드 --accent 위에 --primary를 얹던 마크업(칩·배지·hover 버튼 6곳)은
 * --accent-foreground로 옮겼다. 짝 토큰이 있는데 브랜드색을 얹는 건 토큰 오용이고,
 * 청록 그룹 다크에서 3.92:1로 본문 기준에도 못 미쳤다.
 * 지금 accent 면 위에 남은 --primary는 아이콘 글리프와 1px 보더뿐이라
 * 텍스트(4.5:1)가 아니라 비텍스트 기준(3:1)으로 잰다. 그래도 재긴 잰다 —
 * 행을 지우면 다음에 누가 여기에 글자를 얹어도 아무 게이트가 울지 않는다.
 */
const GRAPHICAL_PAIRS = [["--primary", "--accent"]];

/**
 * 알파 틴트 위 텍스트. 토큰 대 토큰만 재면 여기가 통째로 빈다 — 틴트는 배경을
 * 브랜드색으로 덮어 대비를 깎는다. alpha/surface는 마크업에 적힌 값 그대로다.
 * 새 틴트 조합을 쓰면 여기 한 줄을 추가할 것.
 */
const TINTS = [
  {
    fg: "--primary",
    where: "ComparisonDesktopTable 함량 비율 strong on bg-accent/55 row",
    base: "--card",
    layers: [["--accent", 0.55]],
  },
  {
    fg: "--primary",
    where: "UnitPriceComparison section bg-accent/25 over the page background",
    base: "--background",
    layers: [["--accent", 0.25]],
  },
  {
    fg: "--foreground",
    where: "MethodologyView basis card bg-accent/55 over the page background",
    base: "--background",
    layers: [["--accent", 0.55]],
  },
];

function hslToRgb(token) {
  const [h, s, l] = token.split(/\s+/).map(Number.parseFloat);
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

function relativeLuminance([r, g, b]) {
  const linear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRgb(a, b) {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function contrast(foreground, background) {
  return contrastRgb(hslToRgb(foreground), hslToRgb(background));
}

/** source-over compositing in sRGB — 브라우저가 알파 배경을 합성하는 방식 그대로. */
function composite(fg, bg, alpha) {
  return [0, 1, 2].map((i) => alpha * fg[i] + (1 - alpha) * bg[i]);
}

/** 앱 팔레트를 담은 :root 블록만 고른다. @shakilabs/ui도 자기 :root를 내보낸다. */
function readShippedRootTokens(css) {
  for (const block of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    const tokens = {};
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      tokens[name] = value.trim();
    }
    if (tokens["--background"] && tokens["--status-warning"]) return tokens;
  }
  throw new Error("Built CSS does not ship the app palette :root block");
}

/**
 * main.css의 .dark 블록을 소스에서 읽는다.
 *
 * 산출물 검사의 예외이며, 이유가 있다. `.dark`를 <html>에 붙이는 코드가 없어서
 * Tailwind가 이 블록을 번들에서 통째로 지운다 — dist에는 검사할 대상이 아예 없다.
 * 그래도 값은 저장소에 남아 다음 사람이 테마 토글을 붙이는 순간 그대로 화면에 나간다.
 * 잠들어 있는 동안 썩지 않게 소스에서라도 같은 행렬을 돌린다.
 */
function readDormantDarkTokens(css) {
  const block = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/\.dark\s*\{([^}]*)\}/);
  if (!block) throw new Error("main.css no longer declares a .dark palette block");
  const tokens = {};
  for (const [, name, value] of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

function runMatrix({ tokens, label, assert }) {
  const checks = [
    ...FOREGROUNDS.flatMap((fg) => SURFACES.map((bg) => [fg, bg])),
    ...PAIRS,
  ];
  for (const [fg, bg] of checks) {
    assert(tokens[fg], `${label} is missing ${fg}`);
    assert(tokens[bg], `${label} is missing ${bg}`);
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert(ratio >= AA_BODY,
      `Contrast below WCAG AA in ${label}: ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) = ${ratio.toFixed(2)}:1, need ${AA_BODY}:1`);
  }

  for (const [fg, bg] of GRAPHICAL_PAIRS) {
    assert(tokens[fg], `${label} is missing ${fg}`);
    assert(tokens[bg], `${label} is missing ${bg}`);
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert(ratio >= AA_NON_TEXT,
      `Non-text contrast below WCAG 1.4.11 in ${label}: ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) = ${ratio.toFixed(2)}:1, need ${AA_NON_TEXT}:1`);
  }

  for (const tint of TINTS) {
    assert(tokens[tint.fg], `${label} is missing ${tint.fg}`);
    let surface = hslToRgb(tokens[tint.base]);
    for (const [token, alpha] of tint.layers) {
      assert(tokens[token], `${label} is missing ${token}`);
      surface = composite(hslToRgb(tokens[token]), surface, alpha);
    }
    const ratio = contrastRgb(hslToRgb(tokens[tint.fg]), surface);
    assert(ratio >= AA_BODY,
      `Contrast below WCAG AA in ${label}: ${tint.fg} on ${tint.where} = ${ratio.toFixed(2)}:1, need ${AA_BODY}:1`);
  }

  return checks.length + GRAPHICAL_PAIRS.length + TINTS.length;
}

export function verifyTokenContrast({ distRoot, clientRoot, assert }) {
  const assetsDir = resolve(distRoot, "assets");
  const cssFiles = readdirSync(assetsDir).filter((name) => name.endsWith(".css"));
  assert(cssFiles.length > 0, "Build must emit at least one stylesheet");
  const css = cssFiles.map((name) => readFileSync(resolve(assetsDir, name), "utf8")).join("\n");

  let count = runMatrix({ tokens: readShippedRootTokens(css), label: "shipped :root", assert });
  const source = readFileSync(resolve(clientRoot, "src/assets/css/main.css"), "utf8");
  count += runMatrix({ tokens: readDormantDarkTokens(source), label: "source .dark", assert });
  return count;
}
