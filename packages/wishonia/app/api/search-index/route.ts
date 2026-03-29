/**
 * Proxy for the search index to avoid CORS issues on client-side fetches.
 * Caches the index in memory for 5 minutes.
 */

const SEARCH_INDEX_URL = "https://manual.warondisease.org/assets/json/search-index.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cached: string | null = null;
let lastFetch = 0;

export async function GET() {
  const now = Date.now();

  if (cached && now - lastFetch < CACHE_TTL_MS) {
    return new Response(cached, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  }

  try {
    const res = await fetch(SEARCH_INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cached = await res.text();
    lastFetch = now;
    return new Response(cached, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
