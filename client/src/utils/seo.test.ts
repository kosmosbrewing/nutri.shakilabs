import { describe, expect, it } from "vitest";
import { nutriDataset } from "@/data/dataset";
import { seoStaticPages } from "@/data/seo-static-pages";
import { resolveSeoPage } from "./seo";

const pages = [
  resolveSeoPage({ name: "Home" }),
  ...seoStaticPages.map((page) => resolveSeoPage({ name: page.name })),
  ...nutriDataset.products.map((product) => resolveSeoPage({
    name: "ProductDetail",
    slug: product.slug,
  })),
];

describe("route SEO metadata", () => {
  it("has unique, bounded metadata and self canonicals", () => {
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.canonical)).size).toBe(pages.length);
    expect(pages.every((page) => page.title.length <= 60)).toBe(true);
    expect(pages.every((page) => page.description.length <= 155)).toBe(true);
    expect(pages.every((page) => page.robots === "index,follow")).toBe(true);
  });

  it("keeps comparison canonical free of query state", () => {
    expect(resolveSeoPage({ name: "Compare" }).canonical).toBe(
      "https://shakilabs.com/nutri/compare",
    );
  });

  it("uses noindex and no canonical for invalid routes", () => {
    const page = resolveSeoPage({ name: "ProductDetail", slug: "not-real" });
    expect(page.robots).toBe("noindex,nofollow");
    expect(page.canonical).toBeNull();
  });

  it("does not publish offer or review rating schema", () => {
    const structured = JSON.stringify(pages.map((page) => page.structuredData));
    expect(structured).not.toContain("AggregateRating");
    expect(structured).not.toContain('"@type":"Offer"');
    expect(structured).not.toContain('"@type":"Product"');
  });
});
