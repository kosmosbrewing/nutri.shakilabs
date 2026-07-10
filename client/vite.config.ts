/// <reference types="vitest/config" />

import vue from "@vitejs/plugin-vue";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { products } from "./src/data/products";

const productRoutes = products.map((product) => `/products/${product.slug}`);

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
      "/methodology",
      "/sources",
      ...productRoutes,
      "/404",
    ],
  },
});
