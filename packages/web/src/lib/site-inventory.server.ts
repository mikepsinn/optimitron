import { allNavLinks, type NavItem } from "@/lib/routes";
import {
  getAllSiteConfigs,
  getSiteFromHost,
  isStaticPathEnabledForSite,
  type SiteConfig,
} from "@/lib/site";

export interface ListSitePagesInput {
  site?: string;
}

export interface GetPageContentInput {
  url: string;
}

interface SitePageInventoryEntry {
  description: string | null;
  lastModified: string | null;
  path: string;
  site: string;
  title: string;
  url: string;
}

const MANUAL_HOST = "manual.warondisease.org";
const MANUAL_SITEMAP_URL = `https://${MANUAL_HOST}/sitemap.xml`;
const SITE_INVENTORY_FETCH_TIMEOUT_MS = 10_000;

function hostnameFromOrigin(origin: string) {
  return new URL(origin).hostname.toLowerCase();
}

function primaryHost(site: SiteConfig) {
  return hostnameFromOrigin(site.canonicalOrigin);
}

function normalizeHost(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .split(":")[0]
    ?.toLowerCase() ?? "";
}

function getKnownSite(host: string) {
  const site = getSiteFromHost(host);
  return site.domains.some((domain) => domain.toLowerCase() === host) ||
    primaryHost(site) === host
    ? site
    : null;
}

function navItemsForSite(site: SiteConfig): NavItem[] {
  return [
    ...site.ui.nav.sections.flatMap((section) => section.items),
    ...site.ui.footer.columns.flatMap((column) => column.items),
    ...allNavLinks,
  ];
}

function uniqueByHref(items: NavItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function titleFromPath(pathname: string) {
  if (pathname === "/") return "Home";
  return pathname
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/\[[^\]]+\]/g, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join(" / ");
}

function getRouteCopy(site: SiteConfig, path: string) {
  if (path === "/") {
    return {
      description: site.rootMetadata.description,
      title: site.rootMetadata.title,
    };
  }

  const match = uniqueByHref(navItemsForSite(site)).find(
    (item) => item.href === path || item.matchPrefixes?.includes(path),
  );

  return {
    description: match?.description ?? null,
    title: match?.label ?? titleFromPath(path),
  };
}

function pagePathsForSite(site: SiteConfig) {
  const paths = new Set<string>(["/"]);
  for (const item of navItemsForSite(site)) {
    if (item.external || !item.href.startsWith("/")) continue;
    if (isStaticPathEnabledForSite(site, item.href)) paths.add(item.href);
  }

  for (const prefix of [
    ...site.routePolicy.canonicalPrefixes,
    ...site.routePolicy.publicPrefixes,
  ]) {
    if (prefix.includes("[") || prefix.includes(":")) continue;
    if (isStaticPathEnabledForSite(site, prefix)) paths.add(prefix);
  }

  return [...paths].sort();
}

function appSitePages(site: SiteConfig): SitePageInventoryEntry[] {
  const lastModified = new Date().toISOString();
  return pagePathsForSite(site).map((path) => {
    const copy = getRouteCopy(site, path);
    return {
      description: copy.description,
      lastModified,
      path,
      site: primaryHost(site),
      title: copy.title,
      url: `${site.canonicalOrigin}${path}`,
    };
  });
}

function decodeXmlEntity(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseManualSitemap(xml: string): SitePageInventoryEntry[] {
  const entries: SitePageInventoryEntry[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];

  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    const lastModified = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim() ?? null;
    const decoded = decodeXmlEntity(loc);
    const parsed = new URL(decoded);
    entries.push({
      description: "Manual page from the disease-eradication source documentation.",
      lastModified,
      path: parsed.pathname,
      site: MANUAL_HOST,
      title: titleFromPath(parsed.pathname),
      url: decoded,
    });
  }

  return entries;
}

async function manualPages() {
  const response = await fetch(MANUAL_SITEMAP_URL, {
    headers: { accept: "application/xml,text/xml" },
    signal: AbortSignal.timeout(SITE_INVENTORY_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Manual sitemap fetch failed: ${response.status}`);
  }
  return parseManualSitemap(await response.text());
}

function resolveSites(siteFilter: string | null | undefined) {
  if (!siteFilter?.trim()) {
    return {
      includeManual: true,
      sites: getAllSiteConfigs(),
    };
  }

  const host = normalizeHost(siteFilter);
  if (host === MANUAL_HOST) {
    return { includeManual: true, sites: [] };
  }

  const site = getKnownSite(host);
  if (!site) {
    throw new Error(`Unknown site: ${siteFilter}`);
  }

  return { includeManual: false, sites: [site] };
}

export async function listSitePages(input: ListSitePagesInput = {}) {
  const resolved = resolveSites(input.site);
  const pages = resolved.sites.flatMap(appSitePages);

  if (resolved.includeManual) {
    try {
      pages.push(...(await manualPages()));
    } catch (error) {
      pages.push({
        description:
          error instanceof Error ? error.message : "Manual sitemap fetch failed",
        lastModified: null,
        path: "/",
        site: MANUAL_HOST,
        title: "Manual inventory unavailable",
        url: `https://${MANUAL_HOST}/`,
      });
    }
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));
  return {
    count: pages.length,
    pages,
  };
}

function isAllowedPropertyUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host === MANUAL_HOST) return true;
  const site = getKnownSite(host);
  return !!site && isStaticPathEnabledForSite(site, url.pathname);
}

function htmlEntityDecode(value: string) {
  return decodeXmlEntity(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    );
}

function stripTags(value: string) {
  return htmlEntityDecode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTitle(html: string, url: URL) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) return stripTags(title);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripTags(h1);
  return titleFromPath(url.pathname);
}

function extractMainHtml(html: string) {
  return (
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html
  );
}

function htmlToMarkdown(html: string) {
  let body = extractMainHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");

  body = body.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, text: string) => {
    const cleanText = stripTags(text);
    return cleanText ? `${cleanText} (${href})` : href;
  });

  for (const level of [1, 2, 3, 4, 5, 6]) {
    const marker = "#".repeat(level);
    body = body.replace(
      new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"),
      (_match, text: string) => `\n\n${marker} ${stripTags(text)}\n\n`,
    );
  }

  body = body
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, text: string) => `\n- ${stripTags(text)}`)
    .replace(/<\/(p|div|section|article|header)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return htmlEntityDecode(body);
}

function sectionsFromMarkdown(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim())
    .filter((section): section is string => Boolean(section));
}

export async function getPageContent(input: GetPageContentInput) {
  if (!input.url?.trim()) {
    throw new Error("url is required");
  }

  const url = new URL(input.url);
  if (!isAllowedPropertyUrl(url)) {
    throw new Error(`URL is not an allowed Optimitron property route: ${input.url}`);
  }

  const response = await fetch(url.toString(), {
    headers: { accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(SITE_INVENTORY_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Page fetch failed: ${response.status}`);
  }

  const html = await response.text();
  const content = htmlToMarkdown(html);
  return {
    content,
    lastModified: response.headers.get("last-modified"),
    sections: sectionsFromMarkdown(content),
    title: extractTitle(html, url),
    url: url.toString(),
  };
}
