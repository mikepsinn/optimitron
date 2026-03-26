"use client";

import { useState, useRef, useEffect } from "react";
import {
  citations,
  fmtParam,
  type Parameter,
  type Citation,
} from "@optimitron/data/parameters";
interface StatProps {
  /** The parameter to display. */
  param: Parameter;
  /** Override the formatted string (e.g. to show just the number without unit). */
  format?: (param: Parameter) => string;
  /** Significant figures (default 3). */
  figures?: number;
  /** Extra CSS classes on the outer <span>. */
  className?: string;
}

/**
 * Inline sourced statistic. Renders the formatted value with a dotted underline.
 * Hover/tap shows a tooltip with the description, source, confidence, and citation link.
 *
 * Usage:
 *   <Stat param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} />
 *   → renders "$2.72 trillion" with a tooltip citing SIPRI
 */
export function Stat({ param, format, figures = 3, className = "" }: StatProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const text = format ? format(param) : fmtParam(param, figures);
  const citation: Citation | undefined = param.sourceRef
    ? citations[param.sourceRef]
    : undefined;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline ${className}`}>
      <span
        className="cursor-help border-b border-dotted border-current"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        title={param.description}
      >
        {text}
      </span>

      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded border-4 border-primary bg-background p-3 text-left text-xs text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {param.displayName && (
            <span className="mb-1 block font-black uppercase text-[10px] tracking-wider text-muted-foreground">
              {param.displayName}
            </span>
          )}
          {param.description && (
            <span className="mb-2 block font-bold leading-relaxed text-foreground">
              {param.description}
            </span>
          )}
          <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {param.confidence && (
              <span className={`inline-block rounded px-1.5 py-0.5 font-bold uppercase ${
                param.confidence === "high"
                  ? "bg-green-100 text-green-700"
                  : param.confidence === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}>
                {param.confidence}
              </span>
            )}
            {param.peerReviewed && (
              <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 font-bold uppercase text-blue-700">
                peer-reviewed
              </span>
            )}
          </span>
          {citation?.URL && (
            <a
              href={citation.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block truncate font-bold text-brutal-pink hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {citation.title || citation.URL}
            </a>
          )}
        </span>
      )}
    </span>
  );
}
