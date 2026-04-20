"use client";

import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { BrutalCard } from "@/components/ui/brutal-card";
import { StatCardGrid } from "@/components/ui/stat-card";
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

export function SecretChainPitch({ citizenName, className }: SecretChainPitchProps) {
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

  return (
    <BrutalCard
      bgColor="yellow"
      padding="lg"
      shadowSize={8}
      className={className}
    >
      <p className="text-xs font-black uppercase tracking-widest">You are now node 1.</p>
      <h3 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">
        Tell 2 people the most important secret in the world.
      </h3>
      <p className="mt-4 text-base font-bold leading-snug">
        They tell 2. 32 doublings later, 4.29 billion humans have voted — ~75% of the
        world&apos;s adults. Disease kills ~1.7 people every second. Every minute the chain
        stalls is measurable.
      </p>

      <StatCardGrid
        className="mt-6"
        columns={3}
        stats={[
          {
            value: "2³² = 4.29B",
            label: "Reach at 32 doublings",
            size: "sm",
            color: "pink",
          },
          {
            value: "~11 days",
            label: "Handoff time to hit 4B in 1 year",
            size: "sm",
            color: "cyan",
          },
          {
            value: "~1.7 / sec",
            label: "Disease deaths, globally",
            size: "sm",
            color: "default",
          },
        ]}
      />

      <div className="mt-6">
        <p className="mb-2 text-xs font-black uppercase tracking-wider">
          Text this to your 2 people. They have to call you to hear the secret.
        </p>
        <pre className="whitespace-pre-wrap break-words border-4 border-primary bg-background p-4 text-sm font-bold text-foreground">
          {renderedMessage}
        </pre>
        <Button
          onClick={() => void handleCopy()}
          className="mt-3 w-full font-black uppercase"
          disabled={!renderedMessage}
        >
          {copied ? "Copied →" : "Copy Message"}
        </Button>
      </div>
    </BrutalCard>
  );
}
