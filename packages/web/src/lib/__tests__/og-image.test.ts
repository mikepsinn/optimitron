import { describe, expect, it } from "vitest";
import { toAbsoluteOgImageSrc } from "../og-image";

describe("toAbsoluteOgImageSrc", () => {
  it("passes through absolute http(s) URLs", () => {
    expect(toAbsoluteOgImageSrc("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
    expect(toAbsoluteOgImageSrc("http://cdn.example.com/a.jpg")).toBe(
      "http://cdn.example.com/a.jpg",
    );
  });

  it("prefixes local asset paths with the request origin", () => {
    expect(
      toAbsoluteOgImageSrc("/img/grandma.jpg", "https://1percenttreaty.org"),
    ).toBe("https://1percenttreaty.org/img/grandma.jpg");
  });

  it("upgrades protocol-relative URLs to https", () => {
    expect(toAbsoluteOgImageSrc("//cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
  });

  it("drops unsafe or empty sources", () => {
    expect(toAbsoluteOgImageSrc(null)).toBeNull();
    expect(toAbsoluteOgImageSrc("   ")).toBeNull();
    expect(toAbsoluteOgImageSrc("javascript:alert(1)")).toBeNull();
  });
});
