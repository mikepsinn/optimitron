"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

type CopyState = "idle" | "copied" | "error";

export function OrganizationCopyField({
  label,
  minRows = 3,
  multiline = false,
  value,
}: {
  label: string;
  minRows?: number;
  multiline?: boolean;
  value: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function handleCopy() {
    try {
      await copyTextToClipboard(value);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  const copyLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "error"
        ? "Copy Failed"
        : "Copy";

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-3 text-sm font-bold text-muted-foreground">
        <span>{label}</span>
        <button
          aria-label={`Copy ${label}`}
          className="inline-flex items-center justify-center gap-1 border border-foreground bg-background px-2 py-1 text-xs font-black uppercase text-foreground hover:bg-foreground hover:text-background"
          onClick={() => void handleCopy()}
          type="button"
        >
          {copyState === "copied" ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copyLabel}
        </button>
      </span>
      {multiline ? (
        <textarea
          className="w-full border border-foreground bg-background p-3 font-mono text-xs leading-6 text-foreground"
          readOnly
          rows={minRows}
          value={value}
        />
      ) : (
        <input
          className="w-full border border-foreground bg-background p-3 font-mono text-xs text-foreground"
          readOnly
          value={value}
        />
      )}
    </label>
  );
}
