import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  collectFontCharacters,
  fontJobs,
  shippedFontBudgets,
} from "./font-subset-config.mjs";
import { verifyDeployment } from "./verify-deployment.mjs";
import { verifyRouterSitemap } from "./verify-router-sitemap.mjs";
import { verifyTokenContrast } from "./verify-token-contrast.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const repositoryRoot = resolve(clientRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const siteBase = "https://shakilabs.com/nutri";
const ogImageUrl = `${siteBase}/og-image.png`;
const fontManifest = JSON.parse(readFileSync(resolve(scriptRoot, "font-subset-manifest.json"), "utf8"));
const categoryCatalogInput = JSON.parse(readFileSync(
  resolve(clientRoot, "src/data/category-catalog.json"),
  "utf8",
));
const categoryCatalogResult = z.object({
  categories: z.array(z.object({ slug: z.string() }).passthrough()).length(9),
}).passthrough().safeParse(categoryCatalogInput);
assert(categoryCatalogResult.success, "Category catalog must contain nine valid routes");
const categoryCatalog = categoryCatalogResult.data;
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  assert(existsSync(path), `Missing static output: ${path}`);
  return readFileSync(path, "utf8");
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}
function getAttribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
}

function findTag(html, tagName, attribute, value) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "g")) ?? [];
  return tags.find((tag) => getAttribute(tag, attribute) === value) ?? null;
}

function getCanonical(html) {
  const links = html.match(/<link\b[^>]*>/g) ?? [];
  const canonicals = links.filter((tag) => getAttribute(tag, "rel") === "canonical");
  assert(canonicals.length <= 1, "Page must not contain duplicate canonicals");
  return canonicals[0] ? getAttribute(canonicals[0], "href") : null;
}

function getMeta(html, attribute, value) {
  const tag = findTag(html, "meta", attribute, value);
  return tag ? getAttribute(tag, "content") : null;
}

function getJsonLd(html) {
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? [];
  const script = scripts.find((tag) => getAttribute(tag, "type") === "application/ld+json");
  assert(script, "Indexable page must contain JSON-LD");
  const content = script.replace(/^<script\b[^>]*>/, "").replace(/<\/script>$/, "");
  return JSON.parse(content);
}

function expectedCanonical(route) {
  return route === "/" ? siteBase : `${siteBase}${route}`;
}

// 애드센스 로더 판정. 셸에 하나만 있으므로 정적 산출물에서 직접 센다.
const adsenseLoaderPattern = /<script\b[^>]*(?:pagead2\.googlesyndication\.com|adsbygoogle)[^>]*>/gi;

function countAdsenseLoaders(html) {
  return (html.match(adsenseLoaderPattern) ?? []).length;
}

// 얇은 콘텐츠 판정용 본문 자수. <main> 안의 텍스트만 센다(헤더·푸터·내비 제외).
// 하이드레이션 후에도 같은 DOM이 남으므로 정적 측정과 렌더 후 측정이 일치한다.
function mainTextLength(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  return main
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

const productRoot = resolve(distRoot, "products");
const productFiles = readdirSync(productRoot)
  .filter((file) => file.endsWith(".html"))
  .sort();
assert(productFiles.length === 10, `Expected 10 product pages, received ${productFiles.length}`);
const categoryRoot = resolve(distRoot, "categories");
const categoryFiles = readdirSync(categoryRoot)
  .filter((file) => file.endsWith(".html"))
  .sort();
assert(categoryFiles.length === categoryCatalog.categories.length,
  `Expected ${categoryCatalog.categories.length} category pages, received ${categoryFiles.length}`);

assert(fontManifest.characterSha256 === hash(collectFontCharacters()),
  "UI characters changed; run npm run fonts:subset");
let shippedFontBytes = 0;
for (const budget of shippedFontBudgets) {
  const path = resolve(distRoot, "fonts", budget.publicName);
  assert(existsSync(path), `Missing shipped font: ${budget.publicName}`);
  const content = readFileSync(path);
  shippedFontBytes += content.byteLength;
  assert(content.byteLength <= budget.maxBytes,
    `${budget.publicName} exceeds its ${budget.maxBytes}-byte budget`);
  const generated = fontJobs.some((font) => font.publicName === budget.publicName);
  if (generated) {
    const expected = fontManifest.fonts.find((font) => font.publicName === budget.publicName);
    assert(expected?.sha256 === hash(content), `${budget.publicName} does not match its manifest`);
  }
}
assert(shippedFontBytes <= 180 * 1024, "Shipped fonts exceed the 180 KiB total budget");
const ogImage = readFileSync(resolve(distRoot, "og-image.png"));
assert(ogImage.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", "Social image must be PNG");
assert(ogImage.readUInt32BE(16) === 1200 && ogImage.readUInt32BE(20) === 630,
  "Social image must be 1200x630");

const pages = [
  { route: "/", path: resolve(distRoot, "index.html") },
  { route: "/compare", path: resolve(distRoot, "compare.html") },
  { route: "/categories", path: resolve(distRoot, "categories.html") },
  ...categoryFiles.map((file) => ({
    route: `/categories/${file.replace(/\.html$/, "")}`,
    path: resolve(categoryRoot, file),
  })),
  { route: "/methodology", path: resolve(distRoot, "methodology.html") },
  { route: "/sources", path: resolve(distRoot, "sources.html") },
  { route: "/about", path: resolve(distRoot, "about.html") },
  { route: "/privacy", path: resolve(distRoot, "privacy.html") },
  { route: "/terms", path: resolve(distRoot, "terms.html") },
  { route: "/disclosure", path: resolve(distRoot, "disclosure.html") },
  ...productFiles.map((file) => ({
    route: `/products/${file.replace(/\.html$/, "")}`,
    path: resolve(productRoot, file),
  })),
];
const knownInternalPaths = new Set(pages.map((page) => new URL(expectedCanonical(page.route)).pathname));

const titles = new Set();
const bodyHashes = new Set();
for (const page of pages) {
  const html = read(page.path);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = getMeta(html, "name", "description");
  const robots = getMeta(html, "name", "robots");
  const canonical = getCanonical(html);
  const ogUrl = getMeta(html, "property", "og:url");
  const ogImage = getMeta(html, "property", "og:image");
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  const body = html.match(/<body>[\s\S]*<\/body>/)?.[0] ?? "";
  const hash = createHash("sha256").update(body).digest("hex");

  assert(title && title.length <= 60, `${page.route}: invalid title`);
  assert(description && description.length <= 155, `${page.route}: invalid description`);
  assert(robots === "index,follow", `${page.route}: must be index,follow`);
  assert(canonical === expectedCanonical(page.route), `${page.route}: invalid canonical`);
  assert(ogUrl === canonical, `${page.route}: OG URL must match canonical`);
  assert(ogImage === ogImageUrl, `${page.route}: invalid OG image`);
  assert(h1Count === 1, `${page.route}: expected one H1, received ${h1Count}`);
  assert(html.includes('id="app" data-server-rendered="true"'), `${page.route}: missing SSR body`);
  // 404에서 로더를 떼는 변환이 색인 페이지까지 건드리지 않았는지 역방향으로 검증한다.
  assert(countAdsenseLoaders(html) === 1,
    `${page.route}: indexable page must carry exactly one AdSense loader`);
  // 얇은 콘텐츠 바닥선. 게시자 콘텐츠가 얇으면 "가치가 별로 없는 콘텐츠"로 거절된다.
  const textLength = mainTextLength(html);
  assert(textLength >= 1_500,
    `${page.route}: main content is thin (${textLength} chars, floor 1,500)`);
  const jsonLd = JSON.stringify(getJsonLd(html));
  assert(!jsonLd.includes('"@type":"Product"'), `${page.route}: Product schema is forbidden`);
  assert(!jsonLd.includes('"@type":"Offer"'), `${page.route}: Offer schema is forbidden`);
  assert(!jsonLd.includes("AggregateRating"), `${page.route}: rating schema is forbidden`);
  assert(!titles.has(title), `${page.route}: duplicate title`);
  assert(!bodyHashes.has(hash), `${page.route}: duplicate rendered body`);
  const anchors = html.match(/<a\b[^>]*>/g) ?? [];
  for (const anchor of anchors) {
    const href = getAttribute(anchor, "href");
    if (!href?.startsWith("/nutri")) continue;
    const pathname = new URL(href, "https://shakilabs.com").pathname;
    assert(knownInternalPaths.has(pathname), `${page.route}: broken internal link ${href}`);
    assert(pathname === "/nutri" || !pathname.endsWith("/"),
      `${page.route}: internal link must use the final non-trailing URL ${href}`);
  }
  titles.add(title);
  bodyHashes.add(hash);

  if (page.route.startsWith("/products/")) {
    assert((html.match(/data-nutrient-row/g) ?? []).length === 23,
      `${page.route}: expected 23 nutrient rows`);
  }
  if (page.route.startsWith("/categories/")) {
    const slug = page.route.replace("/categories/", "");
    const catalogCategory = categoryCatalog.categories.find((category) => category.slug === slug);
    const expected = catalogCategory?.registry.length ?? 0;
    assert(expected >= 6, `${page.route}: registry missing from catalog`);
    assert((html.match(/data-official-record/g) ?? []).length === expected,
      `${page.route}: expected ${expected} official registry rows`);
    assert(html.includes("1일 함량 순위") === Boolean(catalogCategory?.activeUnit),
      `${page.route}: amount ranking label must match snapshot amount availability`);
  }
}

const compareHtml = read(resolve(distRoot, "compare.html"));
assert(compareHtml.includes("비교 제품 2개"), "Compare page must render a useful default comparison");
const sourcesHtml = read(resolve(distRoot, "sources.html"));
assert((sourcesHtml.match(/data-source-card/g) ?? []).length === 25,
  "Sources page must contain 25 evidence cards");
const privacyHtml = read(resolve(distRoot, "privacy.html"));
assert(privacyHtml.includes("nutri-analytics-consent"), "Privacy page must disclose local consent storage");
const disclosureHtml = read(resolve(distRoot, "disclosure.html"));
assert(disclosureHtml.includes("모든 가격·판매처 링크는 비제휴"),
  "Disclosure page must state the current non-affiliate status");
// 이 약속은 아래 404 광고 어서션과 한 쌍이다. 문구만 남고 산출물이 어긋나면 심사자가
// 404를 열어보는 순간 자사 문서와의 모순이 드러난다.
assert(disclosureHtml.includes("오류·404·noindex 화면에는 광고를 두지 않습니다"),
  "Disclosure page must keep the no-ads-on-404 promise that the 404 gate enforces");
assert(!pages.some((page) => read(page.path).includes("googletagmanager.com/gtag/js")),
  "Static HTML must not load analytics before consent");

const notFoundHtml = read(resolve(distRoot, "404.html"));
assert(getMeta(notFoundHtml, "name", "robots") === "noindex,nofollow",
  "404.html must be noindex,nofollow");
assert(getCanonical(notFoundHtml) === null, "404.html must not declare a canonical");
assert((notFoundHtml.match(/<h1\b/g) ?? []).length === 1, "404.html must contain one H1");
assert(notFoundHtml.includes('href="/nutri"'), "404.html must contain a recovery link");
// Google "Valuable Inventory": 게시자 콘텐츠가 없는 화면에 광고를 실으면 안 된다.
// /disclosure가 "오류·404·noindex 화면에는 광고를 두지 않습니다"라고 명문화하고 있어,
// 로더가 남아 있으면 자사 공개 문서와 모순된다.
assert(countAdsenseLoaders(notFoundHtml) === 0,
  "404.html must not load the AdSense script (Valuable Inventory: no ads on a contentless screen)");
assert(!/adsbygoogle|googlesyndication/i.test(notFoundHtml),
  "404.html must not reference AdSense at all");

const sitemap = read(resolve(distRoot, "sitemap.xml"));
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = pages.map((page) => expectedCanonical(page.route)).sort();
assert(JSON.stringify([...sitemapUrls].sort()) === JSON.stringify(expectedUrls),
  "Sitemap URLs must exactly match indexable static pages");

verifyDeployment({ distRoot, repositoryRoot, siteBase });

const vercel = JSON.parse(read(resolve(repositoryRoot, "vercel.json")));
assert(vercel.cleanUrls === true, "vercel.json must enable cleanUrls");
assert(!(vercel.rewrites ?? []).some((rewrite) => rewrite.destination === "/index.html"),
  "Catch-all SPA rewrites are forbidden");
assert((vercel.rewrites ?? []).some((rewrite) => rewrite.source === "/nutri/:path*"),
  "Missing /nutri path rewrite");
const appHeaders = vercel.headers?.find((rule) => rule.source === "/(.*)")?.headers ?? [];
assert(appHeaders.some((header) => header.key === "X-Content-Type-Options"), "Missing app security headers");
const fontCache = vercel.headers?.find((rule) => rule.source === "/fonts/(.*)")?.headers ?? [];
assert(!fontCache.some((header) => header.value.includes("immutable")), "Fixed font URLs must revalidate");

const contrastChecks = verifyTokenContrast({ distRoot, clientRoot, assert });
// 위 사이트맵 어서션은 verify-static이 들고 있는 손목록과만 대조한다. 라우터가 진실의
// 원천인지는 따로 봐야 한다 — 라우터에만 추가된 라우트는 그 손목록에도 없기 때문이다.
const routerSitemap = verifyRouterSitemap({ clientRoot, distRoot, siteBase, assert });

console.log(`Validated ${pages.length} indexable pages, 10 products, 9 categories, sitemap, noindex 404, and ${contrastChecks} color-contrast pairs.`);
console.log(`Router/sitemap cross-check: ${routerSitemap.staticChecked} static routes vs ${routerSitemap.sitemapUrls} sitemap URLs, both directions.`);
await import("./verify-unit-price-pages.mjs");
await import("./verify-price-freshness.mjs");
