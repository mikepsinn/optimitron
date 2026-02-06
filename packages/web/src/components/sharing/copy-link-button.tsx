"use client"
import { useState } from "react"

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`px-4 py-2 border-2 border-black font-bold bg-white hover:bg-gray-100 ${className || ''}`}
      onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? '✅ Copied!' : '📋 Copy Link'}
    </button>
  );
}
