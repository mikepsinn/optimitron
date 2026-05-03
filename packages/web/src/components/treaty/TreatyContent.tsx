"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReferendumConfig } from "@/config/referendums";
import { readerMarkdownComponents } from "@/components/referendum/ReferendumStepper";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

/**
 * Treaty body + public signature box, styled to match the /treaty reader mode
 * exactly. Designed for the post-vote dashboard so committed signers can read
 * what they signed and pull quotes when recruiting. Reuses
 * `readerMarkdownComponents` and `ReferendumSiteInlineSign` so the visual
 * stays in lockstep with /treaty — single source of truth for both surfaces.
 */
export function TreatyContent() {
  const config = getReferendumConfig(TREATY_REFERENDUM_SLUG);
  if (!config) return null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <div className="mx-auto h-px w-24 bg-[#8e6b48]/40" />
      <p className="text-center text-3xl font-bold leading-snug tracking-tight text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl">
        {config.introText}
      </p>
      <div className="mx-auto h-px w-24 bg-[#8e6b48]/40" />
      {config.slides.map((slide, i) => (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={readerMarkdownComponents}
        >
          {slide}
        </ReactMarkdown>
      ))}
      <div className="border-t border-[#8e6b48]/30 pt-12">
        <ReferendumSiteInlineSign
          referendumSlug={TREATY_REFERENDUM_SLUG}
          showPrivacyToggle
        />
      </div>
    </div>
  );
}
