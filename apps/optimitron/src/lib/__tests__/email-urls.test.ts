import { describe, expect, it } from "vitest";
import { prefixEmailImage } from "../email/email-urls";

describe("prefixEmailImage", () => {
  it("returns empty string for null/empty input", () => {
    expect(prefixEmailImage(null)).toBe("");
    expect(prefixEmailImage(undefined)).toBe("");
    expect(prefixEmailImage("")).toBe("");
    expect(prefixEmailImage("   ")).toBe("");
  });

  it("passes through absolute http(s) URLs unchanged", () => {
    expect(prefixEmailImage("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(prefixEmailImage("http://cdn.example.com/a.png")).toBe("http://cdn.example.com/a.png");
  });

  it("passes through data: URIs unchanged", () => {
    expect(prefixEmailImage("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });

  it("upgrades protocol-relative URLs to https", () => {
    expect(prefixEmailImage("//cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("prefixes absolute-path URLs with the base", () => {
    expect(prefixEmailImage("/images/hero.png", "https://optimitron.com")).toBe(
      "https://optimitron.com/images/hero.png",
    );
  });

  it("prefixes bare filename paths with the base", () => {
    expect(prefixEmailImage("avatar.png", "https://optimitron.com")).toBe(
      "https://optimitron.com/avatar.png",
    );
  });
});
