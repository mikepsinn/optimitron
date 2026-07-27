"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

export interface IntegrityProofItem {
  label: string;
  value: string;
}

export function IntegrityProof({
  className = "",
  items,
  label = "Technical proof",
}: {
  className?: string;
  items: IntegrityProofItem[];
  label?: string;
}) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function copy(value: string) {
    try {
      await copyTextToClipboard(value);
      setCopiedValue(value);
      window.setTimeout(
        () => setCopiedValue((current) => (current === value ? null : current)),
        2_000,
      );
    } catch {
      // The exact value remains selectable when clipboard access is blocked.
    }
  }

  if (items.length === 0) return null;

  return (
    <details className={className}>
      <summary className="cursor-pointer text-xs font-semibold underline underline-offset-4">
        {label}
      </summary>
      <dl className="mt-3 space-y-3 border-l border-foreground pl-3">
        {items.map((item) => {
          const copied = copiedValue === item.value;
          return (
            <div className="min-w-0" key={`${item.label}:${item.value}`}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 flex min-w-0 items-start gap-2">
                <code className="min-w-0 flex-1 break-all text-xs">
                  {item.value}
                </code>
                <button
                  aria-label={`Copy ${item.label.toLowerCase()}`}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 border border-foreground bg-background px-2 text-xs font-semibold text-foreground hover:bg-foreground hover:text-background"
                  onClick={() => void copy(item.value)}
                  type="button"
                >
                  {copied ? (
                    <Check aria-hidden className="size-3" />
                  ) : (
                    <Copy aria-hidden className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}
