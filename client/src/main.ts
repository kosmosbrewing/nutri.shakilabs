import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./router";
import "./assets/css/main.css";

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
});
