import { describe, expect, it } from "vitest";
import { routes } from "./index";

describe("routes", () => {
  it("contains the public evidence and static 404 routes", () => {
    expect(routes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        "/",
        "/compare",
        "/products/:slug",
        "/methodology",
        "/sources",
        "/about",
        "/privacy",
        "/terms",
        "/disclosure",
        "/404",
      ]),
    );
  });
});
