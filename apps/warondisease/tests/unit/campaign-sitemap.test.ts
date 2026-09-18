import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { GET } from "../../app/sitemap.xml/route";
import { PUBLIC_CAMPAIGN_ROUTES } from "../../lib/sitemap-routes";

vi.mock("@/lib/url", () => ({ getBaseUrl: () => "https://warondisease.org" }));

const appRoot = path.resolve(import.meta.dirname, "../../app");

function pagePaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return pagePaths(filename);
    if (!/^page\.(tsx?|jsx?)$/.test(entry.name)) return [];
    const route = path.relative(appRoot, directory).split(path.sep).join("/");
    return [route ? `/${route}` : "/"];
  });
}

describe("campaign sitemap", () => {
  it("includes every static public page and excludes account, result, and dynamic routes", () => {
    const publicPages = pagePaths(appRoot).filter((route) =>
      !route.includes("[") &&
      !/^\/(?:admin|auth|dashboard|profile)(?:\/|$)/.test(route) &&
      // /send is the authenticated invitation workflow; success pages are
      // post-submit receipts (or redirects), not search landing pages.
      route !== "/send" && !route.endsWith("/success"),
    );
    expect([...PUBLIC_CAMPAIGN_ROUTES].sort()).toEqual(publicPages.sort());
  });

  it("serves campaign URLs without stale clinical or redirect destinations", async () => {
    const response = await GET();
    expect(response.headers.get("content-type")).toBe("application/xml");
    const xml = await response.text();
    const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]);
    expect(urls).toHaveLength(new Set(urls).size);
    expect(urls).toContain("https://warondisease.org/treaty");
    expect(urls).toContain("https://warondisease.org/vote");
    expect(urls).toContain("https://warondisease.org/feedback");
    expect(urls).not.toContain("https://warondisease.org/conditions");
    expect(urls).not.toContain("https://warondisease.org/campaigns");
  });
});
