"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps {
  link?: string;
  url?: string;
  variant?: "default" | "landing";
  className?: string;
}

export function CopyLinkButton({
  link,
  url,
  variant = "default",
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const targetUrl = link ?? url ?? "";

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
        onClick={handleCopy}
        className={cn("h-12 w-full gap-2 font-black uppercase", className)}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Link Copied" : "Copy Referral Link"}
      </Button>
    );
  }

  return (
    <Button type="button" onClick={handleCopy} className={cn("gap-2", className)}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy Link"}
    </Button>
  );
}
