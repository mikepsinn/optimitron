"use client";

import { useState } from "react";
import {
  getShareTemplate,
  DEFAULT_PEER_SHARE_TEMPLATE_ID,
} from "@/lib/tasks/share-templates";
import { renderTemplate } from "@/lib/tasks/render-template";

export interface SecretChainPitchProps {
  /** Viewer-facing name ({citizen_name}) — defaults to "A citizen". */
  citizenName?: string | null;
  className?: string;
}

// One-screen post-vote pitch. "Secret" framing lives here + welcome email step 0.
// Do not add this block to any other surface — the hook loses potency if repeated.

export function SecretChainPitch({
  citizenName,
  className,
}: SecretChainPitchProps) {
  const template = getShareTemplate(DEFAULT_PEER_SHARE_TEMPLATE_ID);
  const renderedMessage = template
    ? renderTemplate(template.body, {
        citizen_name: citizenName?.trim() || "A citizen",
      })
    : "";

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!renderedMessage) return;
    try {
      await navigator.clipboard.writeText(renderedMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fall back to select-and-copy on browsers that block clipboard without user gesture.
    }
  }

  const stats = [
    { value: "2³² = 4.29B", label: "Reach at 32 doublings" },
    { value: "~11 days", label: "Handoff time to hit 4B in 1 year" },
    { value: "~1.7 / sec", label: "Disease deaths, globally" },
  ];

  return (
    <div
      className={`border-2 border-foreground bg-background p-6 text-foreground sm:p-8 ${className ?? ""}`}
    >
      <p className="text-xs font-black uppercase tracking-widest">
        You are now node 1.
      </p>
      <h3 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">
        Tell 2 people the most important secret in the world.
      </h3>
      <p className="mt-4 text-base font-bold leading-snug">
        They tell 2. 32 doublings later, 4.29 billion humans have voted — ~75%
        of the world&apos;s adults. Disease kills ~1.7 people every second.
        Every minute the chain stalls is measurable.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-2 border-foreground bg-background p-4"
          >
            <div className="text-2xl font-black sm:text-3xl">{stat.value}</div>
            <div className="mt-2 text-xs font-bold uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-black uppercase tracking-wider">
          Text this to your 2 people. They have to call you to hear the secret.
        </p>
        <pre className="whitespace-pre-wrap break-words border-2 border-foreground bg-background p-4 text-sm font-bold text-foreground">
          {renderedMessage}
        </pre>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="mt-3 w-full border-2 border-foreground bg-foreground px-4 py-2 font-black uppercase text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          disabled={!renderedMessage}
        >
          {copied ? "Copied →" : "Copy Message"}
        </button>
      </div>
    </div>
  );
}
