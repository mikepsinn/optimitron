"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface CopyableCodeProps {
  code: string;
  className?: string;
}

export function CopyableCode({ code, className }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyTextToClipboard(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; user can still select the text manually.
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 border-2 border-primary bg-background text-foreground px-2 py-1 text-xs font-black uppercase hover:bg-background hover:text-foreground active:translate-y-0.5"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="text-sm font-bold overflow-x-auto p-4 pr-20">
        <code>{code}</code>
      </pre>
    </div>
  );
}
