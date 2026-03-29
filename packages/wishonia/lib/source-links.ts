import type { ScoredResult } from "./search";

export interface SourceLink {
  title: string;
  url: string;
}

const MANUAL_BASE = "https://manual.warondisease.org";

export function normalizeManualUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return MANUAL_BASE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${MANUAL_BASE}${trimmed}`;
  return `${MANUAL_BASE}/${trimmed.replace(/^\.?\//, "")}`;
}

export function extractReadMoreLinks(
  text: string
): { links: SourceLink[]; cleanText: string } {
  const readMoreMatch = text.match(/Read more:[\s\S]*$/i);
  if (!readMoreMatch) return { links: [], cleanText: text };

  const links: SourceLink[] = [];
  const seen = new Set<string>();
  const cleanText = text.slice(0, readMoreMatch.index).trim();
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const match of readMoreMatch[0].matchAll(linkRegex)) {
    const url = normalizeManualUrl(match[2] ?? "");
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ title: match[1] ?? "Source", url });
    }
  }

  return { links, cleanText };
}

export function sourceLinksFromSearchResults(
  results: ScoredResult[],
  limit = 3
): SourceLink[] {
  const seen = new Set<string>();
  const links: SourceLink[] = [];

  for (const result of results) {
    const rawUrl = result.entry.url ?? "";
    if (!rawUrl) continue;

    const url = normalizeManualUrl(rawUrl);
    if (seen.has(url)) continue;

    seen.add(url);
    links.push({
      title: result.entry.title || result.entry.section || "Source",
      url,
    });

    if (links.length >= limit) break;
  }

  return links;
}

export function mergeSourceLinks(
  primary: SourceLink[],
  fallback: SourceLink[],
  limit = 3
): SourceLink[] {
  const merged: SourceLink[] = [];
  const seen = new Set<string>();

  for (const list of [primary, fallback]) {
    for (const link of list) {
      const url = normalizeManualUrl(link.url);
      if (seen.has(url)) continue;
      seen.add(url);
      merged.push({ title: link.title, url });
      if (merged.length >= limit) return merged;
    }
  }

  return merged;
}
