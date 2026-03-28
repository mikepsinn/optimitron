/**
 * Server-side cache for the search index from manual.warondisease.org.
 * Fetches on first use, refreshes every 5 minutes.
 */

import type { SearchEntry } from "./search";

const SEARCH_INDEX_URL = "https://manual.warondisease.org/assets/json/search-index.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedIndex: SearchEntry[] = [];
let lastFetchTime = 0;
let fetchPromise: Promise<SearchEntry[]> | null = null;

export async function getSearchIndex(): Promise<SearchEntry[]> {
  const now = Date.now();

  if (cachedIndex.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedIndex;
  }

  // Deduplicate concurrent fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(SEARCH_INDEX_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cachedIndex = Array.isArray(data) ? data : (data as { entries?: SearchEntry[] }).entries || [];
      lastFetchTime = Date.now();
    } catch (err) {
      console.error("[search-index-cache] Failed to fetch:", err);
      // Return stale cache if available, empty array otherwise
    }
    return cachedIndex;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}
