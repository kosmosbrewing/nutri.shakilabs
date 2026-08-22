/**
 * Contract gate between the published price-freshness rule and what the site renders.
 *
 * The bug this exists to prevent: /methodology, /about and /terms published a
 * "15~30 days shows a refresh badge, 31+ days drops out of the ranking" rule while the
 * freshness clock compared the dataset against its own capture date, so the age was
 * pinned at 0 and no badge ever rendered. Nothing in the build compared the sentences
 * against the behaviour, so the mismatch survived every release.
 *
 * Everything below is re-derived from src/data/freshness.json, the single source the
 * ranking code reads. There is no fallback: a missing badge, an unparsable attribute or
 * a missing rule block fails the build instead of being skipped.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

const policySchema = z.object({
  schemaVersion: z.literal("price-freshness-v1"),
  capturedAt: dateSchema,
  asOf: dateSchema,
  refreshRequiredAfterDays: z.number().int().positive(),
  overdueAfterDays: z.number().int().positive(),
  overdueBehavior: z.enum(["grace", "exclude"]),
}).strict();

const policyResult = policySchema.safeParse(
  JSON.parse(readFileSync(resolve(clientRoot, "src/data/freshness.json"), "utf8")),
);
assert(policyResult.success, `Invalid freshness.json: ${policyResult.success ? "" : z.prettifyError(policyResult.error)}`);
const policy = policyResult.data;

// Mirrors PRICE_AS_OF in src/data/price-freshness.ts: build-time override, committed default.
const injected = dateSchema.safeParse(process.env.VITE_NUTRI_PRICE_AS_OF);
const asOf = injected.success && injected.data >= policy.capturedAt ? injected.data : policy.asOf;

function calendarDay(value) {
  return Date.parse(`${value}T00:00:00Z`) / 86_400_000;
}

const expectedAgeDays = calendarDay(asOf) - calendarDay(policy.capturedAt);
assert(Number.isInteger(expectedAgeDays) && expectedAgeDays >= 0,
  `Freshness asOf (${asOf}) must not precede capturedAt (${policy.capturedAt})`);
const expectedState = expectedAgeDays > policy.overdueAfterDays
  ? "overdue"
  : expectedAgeDays > policy.refreshRequiredAfterDays ? "refresh_required" : "fresh";

// 1. Date single source: every dated price artefact must reconcile to freshness.json.
const unitPriceDataset = JSON.parse(
  readFileSync(resolve(clientRoot, "src/data/unit-price-products.json"), "utf8"),
);
assert(unitPriceDataset.updatedAt === policy.capturedAt,
  `unit-price-products.json updatedAt (${unitPriceDataset.updatedAt}) must equal freshness.json capturedAt (${policy.capturedAt})`);
const unitPriceProducts = unitPriceDataset.categories.flatMap((category) => category.products);
const driftedOffer = unitPriceProducts.find((product) => product.offer.capturedAt !== policy.capturedAt);
assert(!driftedOffer,
  `Offer ${driftedOffer?.id} was captured on ${driftedOffer?.offer.capturedAt}, not ${policy.capturedAt}`);
const productCountBySlug = new Map(
  unitPriceDataset.categories.map((category) => [category.slug, category.products.length]),
);

// 2. Rendered badges and notices must agree with the rule for every page in dist.
function listHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(child);
    return entry.name.endsWith(".html") ? [child] : [];
  });
}

assert(existsSync(distRoot), "Missing dist output; run vite-ssg build first");
const htmlFiles = listHtmlFiles(distRoot);
assert(htmlFiles.length > 0, "No rendered pages found; run vite-ssg build first");

function routeOf(path) {
  const route = `/${relative(distRoot, path).split(sep).join("/").replace(/\.html$/, "")}`;
  return route === "/index" ? "/" : route;
}

const badgePattern = /data-price-freshness="([a-z_]+)"\s+data-price-age-days="([^"]*)"/g;
const noticePattern = /data-price-freshness-notice="([a-z_]+)"/g;
// The ranking's own verdict, emitted by the section that scored the offers. A badge can be
// right while the ranking still measures against the dataset's own date, which is exactly
// the defect this gate exists for, so both clocks are checked separately.
const rankingClockPattern = /data-price-ranking-freshness="([a-z_]+)"\s+data-price-ranking-age-days="([^"]*)"/g;
const badgeCounts = new Map();
const noticeCounts = new Map();
const rankingClockCounts = new Map();
let totalBadges = 0;
let totalRankingClocks = 0;

for (const path of htmlFiles) {
  const route = routeOf(path);
  const html = readFileSync(path, "utf8");

  // A badge carrying only one of the two attributes means the component was edited by hand.
  const looseBadges = (html.match(/data-price-freshness="/g) ?? []).length;
  const badges = [...html.matchAll(badgePattern)];
  assert(badges.length === looseBadges,
    `${route}: ${looseBadges - badges.length} freshness badge(s) are missing data-price-age-days`);

  for (const [, state, age] of badges) {
    assert(state === expectedState,
      `${route}: badge says "${state}" but ${policy.capturedAt}→${asOf} is "${expectedState}"`);
    assert(age === String(expectedAgeDays),
      `${route}: badge says ${age} days but ${policy.capturedAt}→${asOf} is ${expectedAgeDays} days`);
  }
  badgeCounts.set(route, badges.length);
  totalBadges += badges.length;

  const notices = [...html.matchAll(noticePattern)].map(([, state]) => state);
  for (const state of notices) {
    assert(state === expectedState,
      `${route}: notice says "${state}" but the rule resolves to "${expectedState}"`);
  }
  assert(expectedState !== "fresh" || notices.length === 0,
    `${route}: every price is fresh, so no freshness notice may render`);
  noticeCounts.set(route, notices.length);

  const looseClocks = (html.match(/data-price-ranking-freshness="/g) ?? []).length;
  const clocks = [...html.matchAll(rankingClockPattern)];
  assert(clocks.length === looseClocks,
    `${route}: ${looseClocks - clocks.length} ranking clock(s) are missing data-price-ranking-age-days`);
  for (const [, state, age] of clocks) {
    assert(state === expectedState,
      `${route}: the ranking scored prices as "${state}" but the rule resolves to "${expectedState}"`);
    assert(age === String(expectedAgeDays),
      `${route}: the ranking measured ${age} days but ${policy.capturedAt}→${asOf} is ${expectedAgeDays} days`);
  }
  rankingClockCounts.set(route, clocks.length);
  totalRankingClocks += clocks.length;
}

// 3. Per-surface coverage: one badge per published price, one notice per ranking section.
function badgesOn(route) {
  const count = badgeCounts.get(route);
  assert(count !== undefined, `Missing rendered page: ${route}`);
  return count;
}

const multivitaminOffers = 10;
assert(badgesOn("/") === multivitaminOffers,
  `/: expected ${multivitaminOffers} price badges, found ${badgesOn("/")}`);
assert(rankingClockCounts.get("/") === 1, "/: the multivitamin ranking must publish its freshness clock");
for (const [slug, count] of productCountBySlug) {
  const route = `/categories/${slug}`;
  assert(badgesOn(route) === count, `${route}: expected ${count} price badges, found ${badgesOn(route)}`);
  assert(rankingClockCounts.get(route) === 1,
    `${route}: the price-efficiency ranking must publish its freshness clock`);
}
const productRoutes = [...badgeCounts.keys()].filter((route) => route.startsWith("/products/"));
assert(productRoutes.length === multivitaminOffers,
  `Expected ${multivitaminOffers} product pages, found ${productRoutes.length}`);
for (const route of productRoutes) {
  assert(badgesOn(route) === 1, `${route}: expected 1 price badge, found ${badgesOn(route)}`);
}

if (expectedState !== "fresh") {
  const noticeRoutes = ["/", ...productCountBySlug.keys()].map(
    (value) => (value === "/" ? "/" : `/categories/${value}`),
  );
  for (const route of noticeRoutes) {
    assert(noticeCounts.get(route) === 1,
      `${route}: expected exactly one "${expectedState}" freshness notice, found ${noticeCounts.get(route)}`);
  }
}

// 4. The published rule text must describe the behaviour the code actually implements.
const methodologyHtml = readFileSync(resolve(distRoot, "methodology.html"), "utf8");
const ruleBlocks = new Map(
  [...methodologyHtml.matchAll(/data-price-freshness-rule="([a-z_-]+)"[^>]*>([\s\S]*?)<\/li>/g)]
    .map(([, id, body]) => [id, body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]),
);
for (const id of ["fresh", "refresh_required", "overdue", "price-basis"]) {
  assert(ruleBlocks.has(id) && ruleBlocks.get(id).length > 0,
    `/methodology: missing published rule "${id}"`);
}
assert(methodologyHtml.includes("data-price-freshness-contract"),
  "/methodology: missing the rule-to-build contract note");

const expectedTerms = {
  fresh: `0~${policy.refreshRequiredAfterDays}일`,
  refresh_required: `${policy.refreshRequiredAfterDays + 1}~${policy.overdueAfterDays}일`,
  overdue: `${policy.overdueAfterDays + 1}일 이상`,
};
for (const [id, term] of Object.entries(expectedTerms)) {
  assert(ruleBlocks.get(id).startsWith(term),
    `/methodology: rule "${id}" must publish the boundary "${term}", found "${ruleBlocks.get(id)}"`);
}
assert(ruleBlocks.get("refresh_required").includes("갱신 필요"),
  "/methodology: the 15-day rule must name the refresh badge it renders");

// Load-bearing verbs. "grace" keeps overdue prices ranked, so the page must not promise
// removal; "exclude" drops them, so it must not promise a grace period.
const overdueRule = ruleBlocks.get("overdue");
if (policy.overdueBehavior === "grace") {
  assert(overdueRule.includes("유예"),
    "/methodology: overdueBehavior is \"grace\" but the rule does not disclose the grace period");
  assert(!overdueRule.includes("제외"),
    "/methodology: overdueBehavior is \"grace\" but the rule still promises removal from the ranking");
} else {
  assert(overdueRule.includes("제외"),
    "/methodology: overdueBehavior is \"exclude\" but the rule does not state the removal");
  assert(!overdueRule.includes("유예"),
    "/methodology: overdueBehavior is \"exclude\" but the rule still promises a grace period");
}

// 5. The retired claims must not survive anywhere in the rendered site.
const retiredClaims = policy.overdueBehavior === "grace"
  ? ["순위 계산에서 제외합니다", "순위에서 아예 빠집니다", "값은 순위에서 빼며"]
  : [];
for (const path of htmlFiles) {
  const route = routeOf(path);
  const html = readFileSync(path, "utf8");
  for (const claim of retiredClaims) {
    assert(!html.includes(claim),
      `${route}: publishes "${claim}" but overdue prices stay in the ranking`);
  }
}

process.stdout.write(
  `Verified price freshness: ${policy.capturedAt}→${asOf} = ${expectedAgeDays} days (${expectedState}),`
  + ` ${totalBadges} badges and ${totalRankingClocks} ranking clocks across ${htmlFiles.length} pages,`
  + ` ${policy.overdueBehavior} behaviour matches published rule.\n`,
);
