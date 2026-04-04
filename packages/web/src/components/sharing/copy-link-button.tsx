"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  url?: string;
  variant?: "default" | "landing";
  className?: string;
  idleLabel?: string;
  copiedLabel?: string;
}

export function CopyLinkButton({
  url,
  variant = "default",
  className,
  idleLabel,
  copiedLabel,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const targetUrl = url ?? "";
  const defaultIdleLabel = variant === "landing" ? "Copy Referral Link" : "Copy Link";
  const defaultCopiedLabel = variant === "landing" ? "Link Copied" : "Copied";
  const copyLabel = idleLabel ?? defaultIdleLabel;
  const copiedText = copiedLabel ?? defaultCopiedLabel;

  async function handleCopy() {
    if (!targetUrl) {
      return;
    }

    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (variant === "landing") {
    return (
      <Button
        type="button"
        onClick={() => {
          void handleCopy();
        }}
        className={cn("h-12 w-auto gap-2 font-black uppercase", className)}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? copiedText : copyLabel}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className={cn("gap-2", className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedText : copyLabel}
    </Button>
  );
}
