"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades content in when it scrolls into view. Motion is disabled entirely via
 * CSS under prefers-reduced-motion (see eos-preview.css). Purely presentational
 * — content is always in the DOM for SEO, screenshots, and no-JS.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (old webview, disabled JS shim): reveal
    // immediately rather than leaving content stuck at opacity:0.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cls = ["eos-reveal", className].filter(Boolean).join(" ");

  if (Tag === "section") {
    return (
      <section
        className={cls}
        data-shown={shown}
        ref={ref as React.RefObject<HTMLElement>}
      >
        {children}
      </section>
    );
  }
  return (
    <div
      className={cls}
      data-shown={shown}
      ref={ref as React.RefObject<HTMLDivElement>}
    >
      {children}
    </div>
  );
}
