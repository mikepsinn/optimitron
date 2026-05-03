import { afterEach, describe, expect, it, vi } from "vitest";
import { getPageContent, listSitePages } from "../site-inventory.server";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("site inventory", () => {
  it("lists configured pages for one site without fetching the manual sitemap", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSitePages({ site: "warondisease.org" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.count).toBeGreaterThan(0);
    expect(result.pages.every((page) => page.url.startsWith("https://warondisease.org/"))).toBe(
      true,
    );
    expect(result.pages.some((page) => page.url === "https://warondisease.org/vote")).toBe(true);
  });

  it("does not list referendum-content pages on contentless hosts", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSitePages({ site: "optimitron.com" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.pages.some((page) => page.url === "https://optimitron.com/campaign")).toBe(
      false,
    );
    expect(result.pages.some((page) => page.url === "https://optimitron.com/donate")).toBe(true);
  });

  it("extracts clean markdown from an allowed Optimitron property URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        expect(init?.signal).toBeTruthy();
        return new Response(
          "<html><head><title>Vote</title></head><body><main><h1>Vote</h1><p>No HTML soup.</p><ul><li>One task</li></ul></main></body></html>",
          {
            headers: {
              "content-type": "text/html",
              "last-modified": "Wed, 29 Apr 2026 12:00:00 GMT",
            },
          },
        );
      }),
    );

    const result = await getPageContent({ url: "https://warondisease.org/vote" });

    expect(result).toMatchObject({
      lastModified: "Wed, 29 Apr 2026 12:00:00 GMT",
      sections: ["Vote"],
      title: "Vote",
      url: "https://warondisease.org/vote",
    });
    expect(result.content).toContain("# Vote");
    expect(result.content).toContain("- One task");
    expect(result.content).not.toContain("<main");
  });

  it("rejects URLs outside configured Optimitron properties", async () => {
    await expect(getPageContent({ url: "https://example.com/vote" })).rejects.toThrow(
      "URL is not an allowed Optimitron property route",
    );
  });
});
