"use client";

import { useState } from "react";

export function CopyGrantEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // The email address is visible and selectable if clipboard access fails.
    }
  }

  return (
    <button
      type="button"
      className="inline-flex items-center border border-foreground bg-background px-3 py-2 text-xs font-bold uppercase text-foreground hover:bg-foreground hover:text-background"
      onClick={() => void handleCopy()}
    >
      {copied ? "Copied" : "Copy email"}
    </button>
  );
}
