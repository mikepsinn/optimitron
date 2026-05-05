"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReferendumConfig } from "@/config/referendums";
import { readerMarkdownComponents } from "@/components/referendum/ReferendumStepper";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildCourtReferralUrl } from "@/lib/url";

/**
 * Treaty body + public signature box, styled to match the /treaty reader mode
 * exactly. Designed for the post-vote dashboard so committed signers can read
 * what they signed and pull quotes when recruiting. Reuses
 * `readerMarkdownComponents` and `ReferendumSiteInlineSign` so the visual
 * stays in lockstep with /treaty — single source of truth for both surfaces.
 */
export function TreatyContent() {
  const [courtReferralCode, setCourtReferralCode] = useState<string | null>(
    null,
  );
  const config = getReferendumConfig(TREATY_REFERENDUM_SLUG);

  useEffect(() => {
    const currentReferralCode =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("ref");

    if (currentReferralCode) {
      storage.setSignupReferral(currentReferralCode);
      setCourtReferralCode(currentReferralCode);
      return;
    }

    setCourtReferralCode(storage.getSignupReferral());
  }, []);

  if (!config) return null;
  const courtHref = buildCourtReferralUrl(
    { referralCode: courtReferralCode },
    "",
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
      <p className="text-center text-3xl font-bold leading-snug tracking-tight text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl">
        {config.introText}
      </p>
      <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
      {config.slides.map((slide, i) => (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={readerMarkdownComponents}
        >
          {slide}
        </ReactMarkdown>
      ))}
      <div className="border-t border-[var(--treaty-ink-muted)] pt-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
          Next: the enforcement stack
        </p>
        <Link
          href={courtHref}
          className="mt-3 inline-block text-xl font-bold text-[var(--treaty-ink)] underline decoration-[var(--treaty-ink)] decoration-2 underline-offset-4 [font-family:var(--v0-font-libre-baskerville)] hover:text-[var(--treaty-ink-soft)] sm:text-2xl"
        >
          Join the Court of Humanity →
        </Link>
        <p className="mt-3 text-sm font-bold leading-7 text-[var(--treaty-ink-soft)] [font-family:var(--v0-font-libre-baskerville)] sm:text-base">
          The treaty is the off-ramp. The Court is the road that produces the
          off-ramp.
        </p>
      </div>
      <div className="border-t border-[var(--treaty-ink-muted)] pt-12">
        <ReferendumSiteInlineSign
          referendumSlug={TREATY_REFERENDUM_SLUG}
          showPrivacyToggle
        />
      </div>
    </div>
  );
}
