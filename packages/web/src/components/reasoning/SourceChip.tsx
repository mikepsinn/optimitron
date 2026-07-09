"use client";

import { ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source } from "@/lib/reasoning/types";

/**
 * Lightweight citation chip (distinct from the heavyweight `ParameterValue`
 * Dialog). Used inline for non-parameter references: manual chapters,
 * adversarial citations, external research links.
 */
export function SourceChip({ source }: { source: Source }) {
  const isExternal = Boolean(source.url);
  return (
    <a
      href={source.url ?? "#"}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-none border-2 border-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wide leading-tight shadow-none transition-colors hover:bg-foreground hover:text-background",
        source.adversarial
          ? "bg-background text-foreground"
          : "bg-background text-foreground",
      )}
    >
      {source.adversarial ? (
        <AlertTriangle className="h-3 w-3 shrink-0" aria-label="Critical view" />
      ) : null}
      <span className="truncate">{source.label}</span>
      {isExternal ? <ExternalLink className="h-3 w-3 shrink-0" /> : null}
    </a>
  );
}
