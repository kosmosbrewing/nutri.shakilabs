import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/compare",
    name: "Compare",
    component: () => import("@/views/CompareView.vue"),
  },
  {
    path: "/products/:slug",
    name: "ProductDetail",
    component: () => import("@/views/ProductDetailView.vue"),
  },
  {
    path: "/methodology",
    name: "Methodology",
    component: () => import("@/views/MethodologyView.vue"),
  },
  {
    path: "/sources",
    name: "Sources",
    component: () => import("@/views/SourcesView.vue"),
  },
  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/TermsView.vue"),
  },
  {
    path: "/disclosure",
    name: "Disclosure",
    component: () => import("@/views/DisclosureView.vue"),
  },
  {
    path: "/404",
    name: "NotFoundStatic",
    component: () => import("@/views/NotFoundView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
  },
];
