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
    <div className={cn("min-w-0 max-w-full overflow-hidden", className)}>
      <div className="flex justify-end border-b border-foreground/30 p-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
          className="inline-flex items-center gap-1 border-2 border-primary bg-background px-2 py-1 text-xs font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words p-4 text-sm font-bold">
        <code>{code}</code>
      </pre>
    </div>
  );
}
