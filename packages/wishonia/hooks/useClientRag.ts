/**
 * Client-side RAG search for voice mode.
 * Fetches + caches search-index.json from manual.warondisease.org,
 * then exposes searchContent() for local use.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { searchContent, type SearchEntry, type ScoredResult } from "@/lib/search";

// Fetch via local proxy to avoid CORS issues
const SEARCH_INDEX_URL = "/api/search-index";

export function useClientRag() {
  const [indexLoaded, setIndexLoaded] = useState(false);
  const indexRef = useRef<SearchEntry[]>([]);

  useEffect(() => {
    if (indexRef.current.length > 0) {
      setIndexLoaded(true);
      return;
    }

    fetch(SEARCH_INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        indexRef.current = Array.isArray(data)
          ? data
          : (data as { entries?: SearchEntry[] }).entries || [];
        setIndexLoaded(true);
        console.log("[client-rag] Search index loaded:", indexRef.current.length, "entries");
      })
      .catch((err) => {
        console.error("[client-rag] Failed to load search index:", err);
      });
  }, []);

  const search = useCallback(
    (query: string, maxResults = 5, maxChars = 2000): { context: string; results: ScoredResult[] } => {
      if (indexRef.current.length === 0) {
        return { context: "", results: [] };
      }
      return searchContent(indexRef.current, query, maxResults, maxChars);
    },
    []
  );

  return { search, indexLoaded, indexSize: indexRef.current.length };
}
