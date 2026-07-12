import { describe, expect, it } from "vitest";
import { positiveBarWidth } from "./chartMath";

describe("positiveBarWidth", () => {
  it("keeps comparison bars on a zero baseline", () => {
    expect(positiveBarWidth(0, 100)).toBe(0);
    expect(positiveBarWidth(50, 100)).toBe(50);
    expect(positiveBarWidth(120, 100)).toBe(100);
  });
});
