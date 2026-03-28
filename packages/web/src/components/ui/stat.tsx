"use client";

import { useState, useRef, useEffect } from "react";
import {
  citations,
  fmtParam,
  type Parameter,
  type Citation,
} from "@optimitron/data/parameters";
import { Latex } from "@/components/ui/latex";
interface StatProps {
  /** The parameter to display. */
  param: Parameter;
  /** Override the formatted string (e.g. to show just the number without unit). */
  format?: (param: Parameter) => string;
  /** Significant figures (default 3). */
  figures?: number;
  /** Show the unit from fmtParam (default false — surrounding text usually provides context). */
  showUnit?: boolean;
  /** Extra CSS classes on the outer <span>. */
  className?: string;
}

/** Format a parameter value as a plain number (no unit suffix/prefix). */
function fmtValueOnly(param: Parameter, figures = 3): string {
  const unit = (param.unit ?? "").toLowerCase();

  // Percentages: value is 0-1, display as 0-100
  if (unit === "percentage" || unit === "rate" || unit === "percent") {
    return fmtParam(param, figures); // keep the % since it's integral to the number
  }

  // For everything else, strip unit decorations by formatting without unit
  const full = fmtParam(param, figures);

  // Strip trailing unit suffixes like "x", " deaths", " years", etc.
  // but keep "$" prefix and "%" suffix since they're integral
  if (unit === "ratio" || unit === "x" || unit === "multiplier") {
    return full.replace(/x$/, "").trim();
  }

  // Strip trailing unit words (e.g., " deaths", " years", " deaths/year")
  if (unit && !unit.startsWith("usd")) {
    const unitWord = unit.split("/")[0]!;
    const regex = new RegExp(`\\s+${unitWord}.*$`, "i");
    return full.replace(regex, "").trim();
  }

  return full;
}

/**
 * Inline sourced statistic. Renders the formatted value with a dotted underline.
 * Hover/tap shows a tooltip with the description, source, confidence, and citation link.
 * Click opens the calculations URL in a new tab (if available).
 *
 * Units are hidden by default since surrounding text usually provides context.
 * Pass `showUnit` to include the unit from fmtParam.
 *
 * Usage:
 *   <Stat param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} />
 *   → renders "$2.72 trillion" with a tooltip citing SIPRI
 */
export function Stat({ param, format, figures = 3, showUnit = false, className = "" }: StatProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const text = format
    ? format(param)
    : showUnit
      ? fmtParam(param, figures)
      : fmtValueOnly(param, figures);
  const citation: Citation | undefined = param.sourceRef
    ? citations[param.sourceRef]
    : undefined;

  const handleClick = () => {
    if (param.calculationsUrl) {
      window.open(param.calculationsUrl, "_blank", "noopener,noreferrer");
    } else {
      setOpen((v) => !v);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline ${className}`}>
      <span
        className="cursor-help border-b border-dotted border-current"
        onClick={handleClick}
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
          {param.latex ? (
            <span className="my-2 block overflow-x-auto">
              <Latex block>{param.latex}</Latex>
            </span>
          ) : param.formula ? (
            <span className="my-1 block">
              <code className="bg-muted px-1 py-0.5 text-[10px]">{param.formula}</code>
            </span>
          ) : null}
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
          {param.calculationsUrl && (
            <a
              href={param.calculationsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate font-bold text-brutal-cyan hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View calculations
            </a>
          )}
        </span>
      )}
    </span>
  );
}
