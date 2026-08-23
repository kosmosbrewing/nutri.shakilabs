import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 라우터 ↔ 사이트맵 양방향 대조 게이트 (car #46 · travel #45에서 이식).
 *
 * 왜 필요한가: 이 앱의 사이트맵은 dist의 HTML 파일 목록에서 파생되고, verify-static은
 * 자기 손목록으로 그 결과를 다시 대조한다. 두 쪽 다 "라우터에 뭐가 있는지"는 보지 않는다.
 * 라우터에만 추가하고 vite.config의 includedRoutes에 넣는 걸 잊으면 렌더도, 사이트맵도,
 * 어서션도 전부 조용히 통과한다 — 사람이 라우터와 XML을 눈으로 맞대는 것 말고는 잡을
 * 방법이 없다. 실제로 car에서 "/"가 사이트맵에서 사라진 사고가 그렇게 났다.
 *
 * 양방향인 이유:
 *  ① 라우터의 정적 색인 라우트는 사이트맵에 반드시 있어야 한다.
 *  ② 리다이렉트 라우트와 noindex 라우트는 사이트맵에 있으면 안 된다.
 * ①만 검사하면 홈을 리다이렉트로 되돌리고 사이트맵에는 URL을 남기는, 더 나쁜 모순
 * 상태를 통과시킨다. ②만 검사하면 원래 사고를 못 잡는다.
 *
 * "색인 대상이냐"는 손으로 관리하는 목록이 아니라 **렌더된 HTML의 robots 메타**에서
 * 읽는다. 그래야 사이트맵에서 빼려면 실제로 noindex를 선언해야 하고, 목록만 고쳐
 * 게이트를 우회할 수 없다.
 *
 * 폴백은 없다. 라우터를 못 읽거나 라우트를 하나도 못 뽑으면 통과가 아니라 실패다.
 */

/** 라우터 소스를 { path, redirect } 목록으로 뜯는다. 라우터 파일이 진실의 원천이다. */
export function parseRouterRoutes(source) {
  const marker = source.indexOf("export const routes");
  if (marker < 0) throw new Error("router/index.ts no longer exports `routes`");
  const body = source.slice(marker);
  const marks = [...body.matchAll(/path:\s*"([^"]+)"/g)].map((match) => ({
    path: match[1],
    index: match.index,
  }));
  return marks.map((mark, i) => ({
    path: mark.path,
    // 다음 path: 선언 전까지가 이 라우트의 본문이다
    redirect: /redirect:/.test(body.slice(mark.index, marks[i + 1]?.index ?? body.length)),
  }));
}

/**
 * /categories/:slug → ^/categories/[^/]+$ . 동적 라우트가 커버하는 URL을 판정한다.
 *
 * 캐치올(`/:pathMatch(.*)*`)은 일부러 제외한다. 모든 경로에 매칭되므로 역방향 검사를
 * 통째로 무력화한다 — 그런 폴백이 있으면 게이트가 있으나 마나다.
 */
function isCatchAll(path) {
  return path.includes("(");
}

function paramRouteMatcher(path) {
  const pattern = path
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[A-Za-z0-9_]+/g, "[^/]+");
  return new RegExp(`^${pattern}$`);
}

function routeOutputPath(distRoot, route) {
  return resolve(distRoot, `${route === "/" ? "/index" : route}.html`.replace(/^\//, ""));
}

function isNoindex(html) {
  const robots = html.match(/<meta\b[^>]*name="robots"[^>]*>/i)?.[0] ?? "";
  return /content="[^"]*noindex/i.test(robots);
}

export function verifyRouterSitemap({ clientRoot, distRoot, siteBase, assert }) {
  const routerPath = resolve(clientRoot, "src/router/index.ts");
  assert(existsSync(routerPath), `Missing router source: ${routerPath}`);
  const routes = parseRouterRoutes(readFileSync(routerPath, "utf8"));
  assert(routes.length > 0, "Extracted zero routes from router/index.ts; refusing to pass");

  const sitemapPath = resolve(distRoot, "sitemap.xml");
  assert(existsSync(sitemapPath), `Missing sitemap output: ${sitemapPath}`);
  const sitemap = readFileSync(sitemapPath, "utf8");
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  assert(sitemapUrls.size > 0, "Sitemap lists zero URLs; refusing to pass");

  const urlFor = (route) => (route === "/" ? siteBase : `${siteBase}${route}`);
  const index = routes.find((route) => route.path === "/");
  assert(index, "router/index.ts must register an index route");
  assert(!index.redirect,
    "Index route must render its own view: a redirect home canonicalises to the target "
    + "page, and a page whose canonical points elsewhere cannot be listed in the sitemap");

  // ── 정방향: 라우터 → 사이트맵
  let staticChecked = 0;
  for (const route of routes) {
    if (route.path.includes(":")) continue;
    const url = urlFor(route.path);
    if (route.redirect) {
      assert(!sitemapUrls.has(url), `Redirect route must not be listed in the sitemap: ${url}`);
      continue;
    }
    const output = routeOutputPath(distRoot, route.path);
    assert(existsSync(output),
      `Router route ${route.path} has no rendered output (${output}); add it to ssgOptions.includedRoutes`);
    const html = readFileSync(output, "utf8");
    if (isNoindex(html)) {
      assert(!sitemapUrls.has(url), `noindex route must not be listed in the sitemap: ${url}`);
    } else {
      assert(sitemapUrls.has(url), `Router route is missing from the sitemap: ${url}`);
    }
    staticChecked += 1;
  }
  assert(staticChecked > 0, "No static router routes were checked; extraction is broken");

  // ── 역방향: 사이트맵 → 라우터. 어떤 라우트도 못 받는 URL을 색인에 내보내면 안 된다.
  const staticPaths = new Set(routes.filter((r) => !r.path.includes(":")).map((r) => r.path));
  const matchers = routes
    .filter((r) => r.path.includes(":") && !isCatchAll(r.path))
    .map((r) => paramRouteMatcher(r.path));
  const basePath = new URL(siteBase).pathname;
  for (const url of sitemapUrls) {
    const pathname = new URL(url).pathname;
    const route = pathname === basePath ? "/" : pathname.slice(basePath.length);
    assert(staticPaths.has(route) || matchers.some((matcher) => matcher.test(route)),
      `Sitemap URL matches no router route: ${url}`);
  }

  return { staticChecked, sitemapUrls: sitemapUrls.size };
}
