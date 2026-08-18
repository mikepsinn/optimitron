/**
 * Lazy CDN script loader hook.
 * Appends a <script> tag and returns whether it has loaded.
 * Deduplicates: loading the same URL twice returns the same state.
 *
 * Ported from packages/wishonia/hooks/useScript.ts.
 */

"use client";

import { useState, useEffect } from "react";

const scriptCache = new Map<string, Promise<void>>();

export function useScript(src: string | null): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    if (document.querySelector(`script[src="${src}"]`)?.getAttribute("data-loaded") === "true") {
      setLoaded(true);
      return;
    }

    let promise = scriptCache.get(src);
    if (!promise) {
      promise = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          script.setAttribute("data-loaded", "true");
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
      scriptCache.set(src, promise);
    }

    promise.then(() => setLoaded(true)).catch(console.error);
  }, [src]);

  return loaded;
}

/** Load a CSS stylesheet from CDN (for KaTeX). */
export function useStylesheet(href: string | null): void {
  useEffect(() => {
    if (!href) return;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}
