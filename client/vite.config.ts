/// <reference types="vitest/config" />

import vue from "@vitejs/plugin-vue";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { z } from "zod";
import categoryCatalogInput from "./src/data/category-catalog.json";
import { products } from "./src/data/products";

const productRoutes = products.map((product) => `/products/${product.slug}`);
const categoryRouteResult = z.object({
  categories: z.array(z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/) }).passthrough()),
}).passthrough().safeParse(categoryCatalogInput);
if (!categoryRouteResult.success) {
  throw new Error(`Invalid category routes: ${z.prettifyError(categoryRouteResult.error)}`);
}
const categoryRoutes = categoryRouteResult.data.categories.map(
  (category) => `/categories/${category.slug}`,
);

// 404 화면은 제목과 복귀 링크뿐이라 게시자 콘텐츠가 없다. 셸(index.html)에서 물려받은
// AdSense 로더가 여기서 광고를 띄우면 Google "Valuable Inventory" 정책 위반이고,
// /disclosure에 적어 둔 "오류·404·noindex 화면에는 광고를 두지 않습니다"와도 어긋난다.
// 셸을 고치면 모든 페이지에서 광고가 사라지므로, 렌더된 404 산출물에서만 로더를 뗀다.
const ADSENSE_LOADER = /\s*<script\b[^>]*pagead2\.googlesyndication\.com[^>]*>\s*<\/script>/gi;
const AD_FREE_ROUTES = new Set(["/404"]);

export default defineConfig({
  base: "/nutri/",
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    port: 6112,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
  ssgOptions: {
    includedRoutes: () => [
      "/",
      "/compare",
      "/categories",
      ...categoryRoutes,
      "/methodology",
      "/sources",
      "/about",
      "/privacy",
      "/terms",
      "/disclosure",
      ...productRoutes,
      "/404",
    ],
    onPageRendered: (route: string, renderedHTML: string) =>
      (AD_FREE_ROUTES.has(route) ? renderedHTML.replace(ADSENSE_LOADER, "") : renderedHTML),
  },
});
