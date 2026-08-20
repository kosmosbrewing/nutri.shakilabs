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
];
/** 표면 위 전경이 아니라 짝으로만 쓰이는 조합. */
const PAIRS = [
  ["--primary-foreground", "--primary"],
  ["--accent-foreground", "--accent"],
  ["--primary", "--accent"],
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

function contrast(foreground, background) {
  const a = relativeLuminance(hslToRgb(foreground));
  const b = relativeLuminance(hslToRgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
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

export function verifyTokenContrast({ distRoot, assert }) {
  const assetsDir = resolve(distRoot, "assets");
  const cssFiles = readdirSync(assetsDir).filter((name) => name.endsWith(".css"));
  assert(cssFiles.length > 0, "Build must emit at least one stylesheet");
  const css = cssFiles.map((name) => readFileSync(resolve(assetsDir, name), "utf8")).join("\n");
  const tokens = readShippedRootTokens(css);

  const checks = [
    ...FOREGROUNDS.flatMap((fg) => SURFACES.map((bg) => [fg, bg])),
    ...PAIRS,
  ];
  for (const [fg, bg] of checks) {
    assert(tokens[fg], `Built CSS is missing ${fg}`);
    assert(tokens[bg], `Built CSS is missing ${bg}`);
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert(ratio >= AA_BODY,
      `Contrast below WCAG AA: ${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}) = ${ratio.toFixed(2)}:1, need ${AA_BODY}:1`);
  }
  return checks.length;
}
