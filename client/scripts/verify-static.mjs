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

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const repositoryRoot = resolve(clientRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const siteBase = "https://shakilabs.com/nutri";
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
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  const body = html.match(/<body>[\s\S]*<\/body>/)?.[0] ?? "";
  const hash = createHash("sha256").update(body).digest("hex");

  assert(title && title.length <= 60, `${page.route}: invalid title`);
  assert(description && description.length <= 155, `${page.route}: invalid description`);
  assert(robots === "index,follow", `${page.route}: must be index,follow`);
  assert(canonical === expectedCanonical(page.route), `${page.route}: invalid canonical`);
  assert(ogUrl === canonical, `${page.route}: OG URL must match canonical`);
  assert(h1Count === 1, `${page.route}: expected one H1, received ${h1Count}`);
  assert(html.includes('id="app" data-server-rendered="true"'), `${page.route}: missing SSR body`);
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
    assert((html.match(/data-official-record/g) ?? []).length === 6,
      `${page.route}: expected six official record samples`);
    assert(html.includes("순위가 아닙니다"), `${page.route}: missing non-ranking disclosure`);
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
assert(!pages.some((page) => read(page.path).includes("googletagmanager.com/gtag/js")),
  "Static HTML must not load analytics before consent");

const notFoundHtml = read(resolve(distRoot, "404.html"));
assert(getMeta(notFoundHtml, "name", "robots") === "noindex,nofollow",
  "404.html must be noindex,nofollow");
assert(getCanonical(notFoundHtml) === null, "404.html must not declare a canonical");
assert((notFoundHtml.match(/<h1\b/g) ?? []).length === 1, "404.html must contain one H1");

const sitemap = read(resolve(distRoot, "sitemap.xml"));
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = pages.map((page) => expectedCanonical(page.route)).sort();
assert(JSON.stringify([...sitemapUrls].sort()) === JSON.stringify(expectedUrls),
  "Sitemap URLs must exactly match indexable static pages");

verifyDeployment({ distRoot, repositoryRoot, siteBase });

console.log(`Validated ${pages.length} indexable pages, 10 products, 9 categories, sitemap, and noindex 404.`);
