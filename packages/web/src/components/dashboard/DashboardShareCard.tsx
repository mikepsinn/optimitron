"use client";

import { useMemo, useState } from "react";
import { buildShareMessage } from "@/lib/share-message";

interface DashboardShareCardProps {
  referralUrl: string;
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(
      error instanceof Error ? error : new Error("Copy failed"),
    );
  } finally {
    document.body.removeChild(textarea);
  }
}

export function DashboardShareCard({ referralUrl }: DashboardShareCardProps) {
  const defaultMessage = useMemo(
    () => buildShareMessage(referralUrl),
    [referralUrl],
  );
  const [message, setMessage] = useState(defaultMessage);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  async function handleCopy() {
    try {
      await copyToClipboard(message);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <section className="border border-[var(--treaty-ink)]/40 bg-[var(--treaty-paper)] p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink)]/60">
        Send to two humans you love
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
        Each voter who recruits two more is the campaign.
      </h2>
      <p className="mt-2 text-sm font-bold text-[var(--treaty-ink)]/70">
        2 → 4 → 8 → 16 → 32 doubling rounds → 4,300,000,000 humans reached.
      </p>

      <label className="mt-6 block">
        <span className="sr-only">Share message</span>
        <textarea
          className="block w-full resize-y border-2 border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-4 text-base font-bold leading-relaxed text-[var(--treaty-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--treaty-ink)]/40"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          spellCheck
        />
      </label>

      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleCopy}
          className="border-2 border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-paper)] transition-colors hover:bg-[var(--treaty-paper)] hover:text-[var(--treaty-ink)]"
        >
          {copyState === "copied"
            ? "Copied — now paste it"
            : copyState === "error"
              ? "Copy failed"
              : "Copy message"}
        </button>
        <p className="text-xs font-bold text-[var(--treaty-ink)]/60">
          Paste into iMessage, WhatsApp, Signal, email, wherever your people
          read you.
        </p>
      </div>
    </section>
  );
}
