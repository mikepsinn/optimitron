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
    expect(
      result.pages.every((page) =>
        page.url.startsWith("https://warondisease.org/"),
      ),
    ).toBe(true);
    expect(
      result.pages.some((page) => page.url === "https://warondisease.org/vote"),
    ).toBe(true);
    expect(
      result.pages.some(
        (page) => page.url === "https://warondisease.org/campaign",
      ),
    ).toBe(false);
    expect(
      result.pages.some(
        (page) => page.url === "https://warondisease.org/coalition",
      ),
    ).toBe(false);
    expect(
      result.pages.some(
        (page) => page.url === "https://warondisease.org/impact",
      ),
    ).toBe(false);
  });

  it("does not list referendum-content pages on contentless hosts", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSitePages({ site: "optimitron.com" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      result.pages.some(
        (page) => page.url === "https://optimitron.com/campaign",
      ),
    ).toBe(false);
    expect(
      result.pages.some((page) => page.url === "https://optimitron.com/donate"),
    ).toBe(true);
  });

  it("extracts clean markdown from an allowed manual URL", async () => {
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

    const result = await getPageContent({
      url: "https://manual.warondisease.org/knowledge/test-page",
    });

    expect(result).toMatchObject({
      lastModified: "Wed, 29 Apr 2026 12:00:00 GMT",
      sections: ["Vote"],
      title: "Vote",
      url: "https://manual.warondisease.org/knowledge/test-page",
    });
    expect(result.content).toContain("# Vote");
    expect(result.content).toContain("- One task");
    expect(result.content).not.toContain("<main");
  });

  it("serves the rendered logged-out snapshot instead of fetching a loader", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getPageContent({
      url: "https://optimitron.com/invest",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.title).toContain("Invest");
    expect(result.content).toContain(
      "YOUR PLANET MAY BE ELIGIBLE FOR OPTIMIZATION",
    );
    expect(result.content).not.toContain("Booting Earth Optimization System");
  });

  it("rejects a loading shell when no rendered snapshot exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            "<html><body><main>Booting Earth Optimization System. Thank you for your patience. Your civilization is very important to us.</main></body></html>",
          ),
      ),
    );

    await expect(
      getPageContent({
        url: "https://manual.warondisease.org/knowledge/no-snapshot",
      }),
    ).rejects.toThrow("Page returned only its loading shell");
  });

  it("rejects URLs outside configured Optimitron properties", async () => {
    await expect(
      getPageContent({ url: "https://example.com/vote" }),
    ).rejects.toThrow("URL is not an allowed Optimitron property route");
  });
});
