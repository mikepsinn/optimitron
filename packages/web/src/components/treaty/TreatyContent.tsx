"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReferendumConfig } from "@/config/referendums";
import {
  readerMarkdownComponents,
  splitIntoSlides,
} from "@/components/referendum/ReferendumStepper";
import { Button } from "@/components/retroui/Button";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildCourtReferralUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

/**
 * Treaty body plus public signature box, styled to match /treaty reader mode.
 * Reuses the referendum reader and inline sign controls so treaty rendering
 * stays consistent across surfaces.
 */
interface TreatyContentProps {
  bodyMarkdown?: string | null;
  className?: string;
  introText?: string | null;
  showCourtCta?: boolean;
  showInlineSign?: boolean;
}

export function TreatyContent({
  bodyMarkdown = null,
  className,
  introText,
  showCourtCta = true,
  showInlineSign = true,
}: TreatyContentProps = {}) {
  const [courtReferralCode, setCourtReferralCode] = useState<string | null>(
    null,
  );
  const config = getReferendumConfig(TREATY_REFERENDUM_SLUG);

  useEffect(() => {
    const currentReferralCode = new URLSearchParams(window.location.search).get(
      "ref",
    );

    if (currentReferralCode) {
      storage.setSignupReferral(currentReferralCode);
      setCourtReferralCode(currentReferralCode);
      return;
    }

    setCourtReferralCode(storage.getSignupReferral());
  }, []);

  if (!config) return null;
  const slides = bodyMarkdown ? splitIntoSlides(bodyMarkdown) : config.slides;
  const courtHref = buildCourtReferralUrl(
    { referralCode: courtReferralCode },
    "",
  );

  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-10", className)}>
      <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
      <p className="text-center text-3xl font-bold leading-snug tracking-tight text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl">
        {introText ?? config.introText}
      </p>
      <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
      {slides.map((slide) => (
        <ReactMarkdown
          key={`${slide.length}:${slide.slice(0, 80)}`}
          remarkPlugins={[remarkGfm]}
          components={readerMarkdownComponents}
        >
          {slide}
        </ReactMarkdown>
      ))}
      {showCourtCta ? (
        <div className="border-t border-[var(--treaty-ink-muted)] pt-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)] sm:text-sm">
            If your government refuses to sign
          </p>
          <Button
            asChild
            className="mt-4 inline-flex border border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-paper)] shadow-none transition-colors hover:translate-y-0 hover:bg-[var(--treaty-paper)] hover:text-[var(--treaty-ink)] active:translate-x-0 active:translate-y-0 sm:text-base"
            size="md"
            variant="outline"
          >
            <Link href={courtHref} aria-label="Join the Court of Humanity">
              Join the Court of Humanity
            </Link>
          </Button>
          <p className="mt-3 text-sm font-bold leading-7 text-[var(--treaty-ink-soft)] [font-family:var(--v0-font-libre-baskerville)] sm:text-base">
            {showInlineSign
              ? "Sign the treaty here. If your government refuses to sign it, join the class action and sue them for the 102 million people their refusal has killed."
              : "If your government refuses to sign the treaty, join the class action and sue them for the 102 million people their refusal has killed."}
          </p>
        </div>
      ) : null}
      {showInlineSign ? (
        <div className="border-t border-[var(--treaty-ink-muted)] pt-12">
          <ReferendumSiteInlineSign
            referendumSlug={TREATY_REFERENDUM_SLUG}
            showPrivacyToggle
          />
        </div>
      ) : null}
    </div>
  );
}
