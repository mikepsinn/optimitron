"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

export function PosterPrintButton() {
  return (
    <button
      type="button"
      className="border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
      onClick={() => window.print()}
    >
      Print
    </button>
  );
}

export function PosterCopyLinkButton({ value }: { value: string }) {
  const [copyState, setCopyState] = useState<"copied" | "error" | "idle">(
    "idle",
  );

  function handleCopy() {
    void copyTextToClipboard(value)
      .then(() => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
      })
      .catch(() => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 2000);
      });
  }

  return (
    <button
      type="button"
      aria-label="Copy poster referral link"
      className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
      onClick={handleCopy}
    >
      {copyState === "copied" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copyState === "copied"
        ? "Copied"
        : copyState === "error"
          ? "Copy failed"
          : "Copy link"}
    </button>
  );
}
