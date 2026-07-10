import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./router";
import { trackAnalytics } from "./utils/analytics";
import { buildHeadTags, resolveSeoPage } from "./utils/seo";
import "./assets/css/main.css";
import "@shakilabs/ui/styles.css";
import "./assets/css/design-system.css";

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
}, ({ head, router }) => {
  let disposeHead: (() => void) | undefined;
  router.beforeEach((to) => {
    disposeHead?.();
    const page = resolveSeoPage({ name: to.name, slug: to.params.slug });
    const entry = head?.push(buildHeadTags(page));
    disposeHead = entry ? () => entry.dispose() : undefined;
  });
  router.afterEach((to) => {
    trackAnalytics({ name: "page_view", route: to.path });
  });
});
