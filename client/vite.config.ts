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
  },
});
