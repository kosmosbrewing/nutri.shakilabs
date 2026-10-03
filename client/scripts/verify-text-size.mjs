// v8 실측(2026-10-03) 회귀 고정: 뱃지·캡션·표 헤더(text-[10px]/text-[11px]/
// .confidence-badge/.metric-label)가 11px 이하였다(차트 범례 12px 제외 기준에 못 미침).
// 네 선택자가 전부 이 중앙 규칙 하나로만 크기를 받으므로, 이 규칙의 하한만 지키면
// 코드베이스 전체의 해당 발생 지점이 동시에 지켜진다 — 숫자를 다시 낮추면 바로 걸린다
// (역방향 검증). 차트 범례(ComparisonSummaryBars의 text-xs, 12px)는 이 규칙 밖이라
// 이 게이트가 건드리지 않는다 — 브리프의 "차트 범례 12px 제외"와 같은 경계다.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(__dirname, "..");
const distRoot = resolve(clientRoot, "dist");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cssDir = resolve(distRoot, "assets");
const css = readdirSync(cssDir)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(join(cssDir, name), "utf8"))
  .join("\n");
assert(css.length > 0, "No built CSS found - run the build before this gate");

const MIN_BODY_PX = 13;
const rule = css.match(/\.text-\\\[(?:10|11)px\\\],\.confidence-badge,\.metric-label\{font-size:([^;]+);/);
assert(rule, "Expected the centralized secondary-text override rule (text-[10px]/text-[11px]/.confidence-badge/.metric-label) in built CSS");

const raw = rule[1].trim();
const px = raw.endsWith("rem") ? parseFloat(raw) * 16 : parseFloat(raw);
assert(Number.isFinite(px), `Could not parse font-size value: ${raw}`);
assert(px >= MIN_BODY_PX,
  `Secondary text (badges/captions/table headers) must render at ${MIN_BODY_PX}px or more, found ${px}px`);

console.log(`Text-size gate: secondary badge/caption/table-header text renders at ${px}px (floor ${MIN_BODY_PX}px).`);
