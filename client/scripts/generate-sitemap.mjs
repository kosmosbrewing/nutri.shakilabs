import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const siteBase = "https://shakilabs.com/nutri";
const ledgerPath = resolve(scriptRoot, "sitemap-lastmod.json");
const ledgerVersion = "sitemap-lastmod-v1";
// 렌더 산출물이 곧 정답이므로 dist에 쓰고, 저장소에도 같은 내용을 남겨 diff로 감사 가능하게 한다
const outputPaths = [resolve(distRoot, "sitemap.xml"), resolve(clientRoot, "public", "sitemap.xml")];
// 색인 대상이 아닌 페이지는 사이트맵에서 뺀다 (404는 noindex)
const excludedFiles = new Set(["404.html"]);

function resolveBuildDate() {
  const candidate = process.env.BUILD_DATE?.trim();
  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) return candidate;
  return new Date().toISOString().slice(0, 10);
}

function listHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(child);
    return extname(entry.name) === ".html" ? [child] : [];
  });
}

// dist에서 라우트를 뽑으면 vite.config의 includedRoutes와 자동으로 일치한다.
// verify-static이 자체 목록으로 loc 집합을 다시 대조하므로 교차 검증은 유지된다.
function collectPages() {
  return listHtmlFiles(distRoot)
    .filter((path) => !excludedFiles.has(relative(distRoot, path).split(sep).join("/")))
    .map((path) => {
      const route = `/${relative(distRoot, path).split(sep).join("/").replace(/\.html$/, "")}`;
      return { route: route === "/index" ? "/" : route, path };
    })
    // 루트를 맨 앞에 두고 나머지는 사전순 — 순서는 색인에 영향이 없고 diff만 안정된다
    .sort((left, right) => {
      if (left.route === "/") return -1;
      if (right.route === "/") return 1;
      return left.route.localeCompare(right.route);
    });
}

// 번들 파일명에는 콘텐츠 해시가 붙어 있어, 코드 한 줄만 고쳐도 28개 페이지가 전부
// "바뀐 것"으로 보인다. 자산 참조를 지우고 실제 마크업만 지문으로 삼는다.
function fingerprint(html) {
  const normalized = html
    .replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/gi, "")
    .replace(/<link\b[^>]*\/assets\/[^>]*>/gi, "")
    .trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

function loadLedger() {
  if (!existsSync(ledgerPath)) return {};
  const parsed = JSON.parse(readFileSync(ledgerPath, "utf8"));
  if (parsed.schemaVersion !== ledgerVersion) return {};
  const routes = parsed.routes ?? {};
  // 손상된 항목은 조용히 버린다 — 잘못된 날짜보다 빌드 날짜 폴백이 낫다
  return Object.fromEntries(Object.entries(routes).filter(([, value]) => (
    typeof value?.contentHash === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value?.lastmod ?? "")
  )));
}

function renderSitemap(entries) {
  const body = entries
    .map(({ loc, lastmod }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function renderLedger(records) {
  return `${JSON.stringify({ schemaVersion: ledgerVersion, routes: records }, null, 2)}\n`;
}

if (!existsSync(distRoot)) throw new Error("Missing dist output; run vite-ssg build first");

const buildDate = resolveBuildDate();
const previous = loadLedger();
const pages = collectPages();
if (pages.length === 0) throw new Error("No rendered pages found; run vite-ssg build first");

const records = {};
const changed = [];
const entries = pages.map(({ route, path }) => {
  const contentHash = fingerprint(readFileSync(path, "utf8"));
  const known = previous[route];
  // 내용이 그대로면 이전 날짜를 유지한다. 매 빌드 오늘 날짜로 밀면 lastmod가 거짓 신호가 된다.
  const lastmod = known && known.contentHash === contentHash ? known.lastmod : buildDate;
  if (!known || known.contentHash !== contentHash) changed.push(route);
  records[route] = { contentHash, lastmod };
  return { loc: route === "/" ? siteBase : `${siteBase}${route}`, lastmod };
});

const sitemap = renderSitemap(entries);
for (const path of outputPaths) writeFileSync(path, sitemap, "utf8");
writeFileSync(ledgerPath, renderLedger(records), "utf8");

const summary = `${entries.length} URLs, ${changed.length} changed`;
if (changed.length > 0) {
  console.log(`[sitemap] ${summary} → lastmod ${buildDate}: ${changed.join(" ")}`);
  console.log("[sitemap] scripts/sitemap-lastmod.json changed; commit it so rebuilds keep these dates");
} else {
  console.log(`[sitemap] ${summary}; existing lastmod values kept`);
}
