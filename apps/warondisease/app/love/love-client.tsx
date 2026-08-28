"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

interface LoveShareButtonProps {
  className?: string;
  /** URL to copy. Falls back to the current page when absent. */
  value?: string;
}

export function LoveShareButton({ className, value }: LoveShareButtonProps) {
  const [label, setLabel] = useState("Share this page");

  function handleClick() {
    void copyTextToClipboard(value ?? window.location.href)
      .then(() => {
        setLabel("Copied!");
        window.setTimeout(() => setLabel("Share this page"), 2000);
      })
      .catch(() => {
        window.setTimeout(() => setLabel("Share this page"), 2000);
      });
  }

  return (
    <button className={className} onClick={handleClick} type="button">
      {label}
    </button>
  );
}

export function LoveCopyButton({
  className,
  value,
}: {
  className?: string;
  value: string;
}) {
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
    <button className={className} onClick={handleCopy} type="button">
      {copyState === "copied" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copyState === "copied"
        ? "Copied"
        : copyState === "error"
          ? "Copy failed"
          : "Copy URL"}
    </button>
  );
}
