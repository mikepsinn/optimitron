import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getEmailBaseUrl, prefixEmailImage } from "../email/email-urls";

describe("getEmailBaseUrl", () => {
  const originalBase = process.env.NEXT_PUBLIC_BASE_URL;

  afterEach(() => {
    if (originalBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_BASE_URL = originalBase;
  });

  it("returns the production canonical origin when NEXT_PUBLIC_BASE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    expect(getEmailBaseUrl()).toBe("https://optimitron.com");
  });

  it("returns a configured https base URL", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://preview.optimitron.com";
    expect(getEmailBaseUrl()).toBe("https://preview.optimitron.com");
  });

  it("falls back to the canonical origin for localhost values", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3001";
    expect(getEmailBaseUrl()).toBe("https://optimitron.com");
  });

  it("strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://foo.example.com/";
    expect(getEmailBaseUrl()).toBe("https://foo.example.com");
  });
});

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
