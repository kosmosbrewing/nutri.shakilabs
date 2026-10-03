// v8 실측(2026-10-03) 회귀 고정: 390px에서 "얼라이브 원스데일리" 같은 제품명이
// 음절 중간에서 끊겼다. 원인은 .break-keep(특이도 0,1,0)을 word-break:normal로 되덮는
// 미디어쿼리 규칙이 :is(h1..h4){word-break:keep-all}(특이도 0,0,1)을 항상 이기는
// 특이도 사고였다 — 소스가 아니라 빌드된 CSS로 판정해야 실제로 이겼는지 알 수 있다
// (verify-utility-emission.mjs와 같은 원칙).
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

// 미니파이 후 `.break-keep{...}` 블록을 전부 모아, 그중 하나라도 word-break를
// normal로 되돌리면 즉시 걸린다 (역방향 검증: 이 줄을 되돌리면 이 테스트가 실패한다).
const breakKeepRules = css.match(/\.break-keep\{[^}]*\}/g) ?? [];
assert(breakKeepRules.length > 0, "No .break-keep rule found in built CSS - did the Tailwind utility get purged?");

const offenders = breakKeepRules.filter((rule) => /word-break\s*:\s*normal/.test(rule));
assert(offenders.length === 0,
  `.break-keep must never be overridden back to word-break:normal at any width (found: ${offenders.join(", ")})`);

assert(breakKeepRules.some((rule) => /word-break\s*:\s*keep-all/.test(rule)),
  ".break-keep must set word-break:keep-all somewhere in the built CSS");

console.log(`Word-break gate: ${breakKeepRules.length} .break-keep rule(s) in built CSS, keep-all holds at every width.`);
