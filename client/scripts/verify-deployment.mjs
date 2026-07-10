import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  assert(existsSync(path), `Missing deployment file: ${path}`);
  return readFileSync(path, "utf8");
}

export function verifyDeployment({ distRoot, repositoryRoot, siteBase }) {
  const robots = read(resolve(distRoot, "robots.txt"));
  assert(robots.includes(`Sitemap: ${siteBase}/sitemap.xml`),
    "robots.txt must reference sitemap");

  const vercel = JSON.parse(read(resolve(repositoryRoot, "vercel.json")));
  assert(vercel.cleanUrls === true, "vercel.json must enable cleanUrls");
  assert(vercel.trailingSlash === false, "vercel.json must disable trailing slashes");
  assert(!(vercel.rewrites ?? []).some((rewrite) => rewrite.destination === "/index.html"),
    "Catch-all SPA rewrites are forbidden");
  const rewrites = vercel.rewrites ?? [];
  assert(rewrites.some((rule) => rule.source === "/nutri" && rule.destination === "/"),
    "Missing /nutri root rewrite");
  assert(rewrites.some((rule) => rule.source === "/nutri/:path*" && rule.destination === "/:path*"),
    "Missing /nutri path-preserving rewrite");

  const globalHeaders = vercel.headers?.find((rule) => rule.source === "/(.*)")?.headers ?? [];
  const requiredHeaders = [
    "Content-Language", "X-Content-Type-Options", "X-Frame-Options",
    "Referrer-Policy", "Strict-Transport-Security", "Permissions-Policy",
  ];
  for (const key of requiredHeaders) {
    assert(globalHeaders.some((header) => header.key === key), `Missing global ${key} header`);
  }

  const assetCache = vercel.headers?.find((rule) => rule.source === "/assets/(.*)")?.headers ?? [];
  assert(assetCache.some((header) => header.key === "Cache-Control"
    && header.value.includes("max-age=31536000") && header.value.includes("immutable")),
  "Hashed assets must use immutable caching");
  const fontCache = vercel.headers?.find((rule) => rule.source === "/fonts/(.*)")?.headers ?? [];
  assert(fontCache.some((header) => header.key === "Cache-Control"
    && header.value.includes("stale-while-revalidate") && !header.value.includes("immutable")),
  "Fixed font URLs must revalidate");
  const htmlCache = vercel.headers?.find(
    (rule) => rule.source === "/((?:index\\.html)?|[^.]*)",
  )?.headers ?? [];
  assert(htmlCache.some((header) => header.key === "Cache-Control"
    && header.value.includes("must-revalidate")), "HTML must revalidate");
}
