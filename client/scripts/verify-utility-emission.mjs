// Dead-utility gate, ported from the fleet-wide sweep (house/biz/invest).
//
// Tailwind silently drops any class it cannot resolve: an opacity step outside
// theme.opacity (bg-primary/8), a colour name missing from the theme, a spacing
// value off the scale (mt-13), or the v4 suffix-important form (mt-4!). The
// build succeeds, the markup keeps the class, and the style is simply never
// painted. Five apps shipped with an unpainted site-header background this way.
//
// Verdict comes from the built CSS, not from source inspection: every
// colour/spacing utility literal found in the source must have a generated
// rule in dist/assets/*.css. Suffix-important is an error on sight because
// Tailwind v3 never emits it.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(__dirname, "..");
const distRoot = resolve(clientRoot, "dist");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(vue|ts)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const cssDir = resolve(distRoot, "assets");
const css = readdirSync(cssDir)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(join(cssDir, name), "utf8"))
  .join("\n");
assert(css.length > 0, "No built CSS found - run the build before this gate");

// Colour utilities with a slash-opacity modifier (bg-primary/12, hover:bg-card/[92%]).
const colorUtility =
  /(?:[a-z-]+:)*(?:bg|text|border|ring|divide|fill|stroke|outline|placeholder|from|via|to|shadow|accent|decoration|caret)-[a-z][a-z0-9-]*\/(?:\d+|\[[0-9.]+%?\])/g;
// Numeric spacing utilities only; fractions (w-1/2) and dynamic strings stay
// out of scope to avoid false positives.
const spacingUtility =
  /(?<![\w/[-])(?:[a-z-]+:)*-?(?:m[trblxyse]?|p[trblxyse]?|gap(?:-[xy])?|space-[xy])-(?:\d+(?:\.\d+)?|px)(?![\w/%.[-])/g;
// Tailwind v3 spells important as a prefix (!mt-4); the v4 suffix form emits nothing.
const trailingBang =
  /(?:[a-z-]+:)*(?:bg|text|border|ring|shadow|rounded|opacity|flex|grid|gap|w|h|z|m[trblxyse]?|p[trblxyse]?)-[a-z0-9[\]/.%-]+!(?=[\s"'`])/g;

const toSelector = (cls) => "." + cls.replace(/[/[\]%.:]/g, (ch) => "\\" + ch);

const missing = [];
const bangs = [];
let checked = 0;
for (const file of collectSourceFiles(resolve(clientRoot, "src"))) {
  // Two spots cannot go silently dead and only produce noise here:
  // - HTML comments never render, so utilities named in them need no CSS rule.
  // - @apply with an unknown class fails the build loudly, so anything inside
  //   it that survived the build is proven alive (its styles are inlined,
  //   no standalone selector is emitted).
  const source = readFileSync(file, "utf8")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/@apply[^;]*;/g, " ");
  const rel = file.slice(clientRoot.length + 1);
  for (const pattern of [colorUtility, spacingUtility]) {
    for (const cls of new Set(source.match(pattern) ?? [])) {
      checked += 1;
      if (!css.includes(toSelector(cls))) missing.push(`${cls} (${rel})`);
    }
  }
  if (file.endsWith(".vue")) {
    for (const cls of new Set(source.match(trailingBang) ?? [])) {
      bangs.push(`${cls} (${rel})`);
    }
  }
}

assert(missing.length === 0,
  "These utilities produced no CSS rule - value off the Tailwind scale or colour "
    + "missing from the theme. Snap to a generated value or use arbitrary-value "
    + "syntax (bg-primary/[8%], mt-[52px]):\n  " + missing.join("\n  "));
assert(bangs.length === 0,
  "Suffix-important is Tailwind v4 syntax and emits nothing in v3 - use the "
    + "!prefix form instead:\n  " + bangs.join("\n  "));

console.log(`Utility emission: ${checked} colour/spacing utilities checked against the built CSS.`);
