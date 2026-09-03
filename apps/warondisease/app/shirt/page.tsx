import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  PER_SHIRT_TRUE_VALUE_USD,
} from "@optimitron/data/parameters";
import Layout from "@/components/layout";
import { CampaignQrCode } from "@/components/sharing/campaign-qr-code";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TaskFundingProgress } from "@/components/task-funding/TaskFundingProgress";
import { TshirtSilhouette } from "@/components/shirt/TshirtSilhouette";
import { getSessionUser } from "@/lib/auth-utils";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { CAMPAIGN_PRINT_COPY, SHIRT_BACK_COPY_LINES } from "@/lib/messaging";
import { optimitronUrl } from "@/lib/optimitron-links";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { ROUTES } from "@/lib/routes";
import {
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
} from "@/lib/treaty-share-flow-parameters";
import { buildReferralUrl } from "@/lib/url";
import { ShirtDownloadImageButton } from "./shirt-client";

const apocalypseCount = Math.round(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value,
).toLocaleString("en-US");

export const metadata: Metadata = {
  title: "Buy the t-shirt that ended war and disease — 1% Treaty",
  description: `Every human on earth would be vastly richer and significantly less dead in a world where we agreed to sacrifice one of our ${apocalypseCount} apocalypse capacity for disease eradication. 8 billion people wearing this t-shirt will make it clear that 8 billion people agree on this arrangement.`,
};

const SHIRT_BACK_ARTWORK_ID = "war-on-disease-shirt-back";
const PLEDGE_SHIRT_TASK_ID = "pledge-shirt-assurance-contract";
const VISIBLE_TARGET_MIN_FONT_SIZE = 38;
const VISIBLE_TARGET_MAX_FONT_SIZE = 92;
const VISIBLE_TARGET_MAX_WIDTH_PX = 2040;
const MONO_AVERAGE_GLYPH_WIDTH_EM = 0.62;
const DIY_BODY_CLASS_NAME =
  "text-base font-bold leading-relaxed text-foreground";
const DIY_HEADING_CLASS_NAME = "text-2xl font-black uppercase sm:text-3xl";
const DIY_SHIRT_COPY_CLASS_NAME =
  "border border-foreground p-3 font-mono text-sm font-black uppercase";

/**
 * Buying a shirt and recording a pledge both stay on optimitron.com. Their API
 * routes depend on the commerce catalog, print fulfilment, and pledge escrow
 * code that lives only in that app, and a cross-origin POST from this domain
 * could not carry the optimitron.com session cookie anyway.
 */
const OPTIMITRON_SHIRT_URL = optimitronUrl(ROUTES.shirt);

function getVisibleTargetUrl(targetUrl: string) {
  return targetUrl.replace(/^https?:\/\//, "");
}

function getFittingMonoFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number,
) {
  return Math.max(
    VISIBLE_TARGET_MIN_FONT_SIZE,
    Math.min(
      maxFontSize,
      Math.floor(
        maxWidth / Math.max(text.length * MONO_AVERAGE_GLYPH_WIDTH_EM, 1),
      ),
    ),
  );
}

function ArtworkPanel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <figure>
      <figcaption className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </figcaption>
      <div className="border-2 border-foreground bg-background p-2">
        {children}
      </div>
    </figure>
  );
}

function formatUsdCents(value: number) {
  return value.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  });
}

const PLAIN_SHIRT_RESALE_BASELINE_USD = 10;

function formatRoundedMultiplier(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function FixExistingShirtsSection() {
  const perShirtTrueValueText = formatUsdCents(PER_SHIRT_TRUE_VALUE_USD.value);
  const resaleMultiplierText = formatRoundedMultiplier(
    PER_SHIRT_TRUE_VALUE_USD.value / PLAIN_SHIRT_RESALE_BASELINE_USD,
  );

  return (
    <section
      aria-labelledby="fix-existing-shirts-heading"
      className="mt-12 border-t-2 border-foreground pt-8"
    >
      <div className="space-y-6">
        <header className="space-y-4">
          <h2
            className={DIY_HEADING_CLASS_NAME}
            id="fix-existing-shirts-heading"
          >
            FIX YOUR EXISTING T-SHIRTS.
          </h2>
          <p className={DIY_BODY_CLASS_NAME}>
            Do you already own a t-shirt? Even several?
          </p>
        </header>

        <div className="space-y-4">
          <p className={DIY_BODY_CLASS_NAME}>
            If so, you can easily upgrade your existing t-shirts. The market
            value of a plain white t-shirt is approximately $
            {PLAIN_SHIRT_RESALE_BASELINE_USD}. The market value of a t-shirt
            that ended war and disease is approximately{" "}
            <ParameterValue
              className="font-black"
              figures={2}
              param={PER_SHIRT_TRUE_VALUE_USD}
              valueOverride={perShirtTrueValueText}
            />
            . Upgrading yours increases its resale value by approximately{" "}
            <ParameterValue
              className="font-black"
              param={PER_SHIRT_TRUE_VALUE_USD}
              valueOverride={resaleMultiplierText}
            />{" "}
            times.
          </p>

          <div className="space-y-3">
            <p className={DIY_BODY_CLASS_NAME}>
              <strong>On the front, write:</strong>
            </p>
            <p className={DIY_SHIRT_COPY_CLASS_NAME}>
              THIS T-SHIRT ENDED WAR AND DISEASE.
            </p>
          </div>

          <div className="space-y-3">
            <p className={DIY_BODY_CLASS_NAME}>
              <strong>On the back, write:</strong>
            </p>
            <p className={DIY_SHIRT_COPY_CLASS_NAME}>
              Trade one apocalypse for disease eradication at warondisease.org.
            </p>
          </div>

          <p className={DIY_BODY_CLASS_NAME}>
            Lay the shirt flat on cardboard so the marker doesn&apos;t bleed
            through. Pencil-trace if your hand is shaky. Fill in with marker.
            Let dry for an hour before wearing.
          </p>

          <p className={DIY_BODY_CLASS_NAME}>
            Do this to every white t-shirt you currently own. The first time
            someone sees you wearing one, they will ask. That is the point.
          </p>
        </div>

        <section
          aria-labelledby="blank-shirt-cost-heading"
          className="space-y-4"
        >
          <h3 className={DIY_HEADING_CLASS_NAME} id="blank-shirt-cost-heading">
            THE COST OF WEARING A BLANK T-SHIRT IN PUBLIC.
          </h3>

          <p className={DIY_BODY_CLASS_NAME}>
            Conservative estimate: in 1 day of public wearing, your shirt is
            seen by approximately 50 humans. Assume 0.1% of seers (1 in 1,000)
            would convert to a verified treaty vote if your shirt carried the
            message. That is approximately 0.05 verified voters per shirt-day.
          </p>

          <p className={DIY_BODY_CLASS_NAME}>
            Each verified voter is projected to prevent approximately{" "}
            <ParameterValue
              className="font-black"
              param={FLOW_VOTER_LIVES_SAVED_ROUNDED}
            />{" "}
            deaths from disease and{" "}
            <ParameterValue
              className="font-black"
              param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED}
            />{" "}
            years of suffering across their lifetime.
          </p>

          <p className={DIY_BODY_CLASS_NAME}>
            So 1 day of wearing a blank t-shirt in public costs approximately
            0.135 deaths from disease and 24,000 hours of suffering that would
            not have happened if you had instead worn one with this message.
          </p>

          <p className={DIY_BODY_CLASS_NAME}>
            Over 1 year of public shirt-wearing, blanks cost approximately 50
            deaths and 8.8 million hours of suffering.
          </p>

          <p className={DIY_BODY_CLASS_NAME}>
            Good news: every blank shirt in your closet is a billboard you
            already own, currently advertising nothing. Pick up a marker and it
            starts saving lives by lunch.
          </p>

          <p className="text-sm font-bold italic leading-relaxed text-muted-foreground">
            *Estimates use 50-seers/day + 0.1% conversion as conservative
            assumptions. Real numbers may be 10× higher or lower depending on
            visibility patterns and audience.*
          </p>
        </section>
      </div>
    </section>
  );
}

function ShirtFrontArtwork() {
  const [lineOne, lineTwo, lineThree] = CAMPAIGN_PRINT_COPY.shirtFrontLines;

  return (
    <svg
      aria-label="Front shirt artwork"
      className="h-auto w-full bg-background text-foreground"
      height="3000"
      role="img"
      viewBox="0 0 2400 3000"
      width="2400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#ffffff" height="3000" width="2400" />
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="264"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="1040"
      >
        {lineOne}
      </text>
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="340"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="1415"
      >
        {lineTwo}
      </text>
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="264"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="1790"
      >
        {lineThree}
      </text>
    </svg>
  );
}

function ShirtBackArtwork({
  qrTarget,
  visibleTargetUrl,
}: {
  qrTarget: string;
  visibleTargetUrl: string;
}) {
  const visibleTargetLabel = visibleTargetUrl.toUpperCase();
  const visibleTargetFontSize = getFittingMonoFontSize(
    visibleTargetLabel,
    VISIBLE_TARGET_MAX_WIDTH_PX,
    VISIBLE_TARGET_MAX_FONT_SIZE,
  );

  return (
    <svg
      aria-label={`Back shirt artwork with QR code for ${visibleTargetUrl}`}
      className="h-auto w-full bg-background text-foreground"
      data-qr-target={qrTarget}
      height="3000"
      id={SHIRT_BACK_ARTWORK_ID}
      role="img"
      viewBox="0 0 2400 3000"
      width="2400"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#ffffff" height="3000" width="2400" />
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="140"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="260"
      >
        {SHIRT_BACK_COPY_LINES[0]}
      </text>
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="136"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="435"
      >
        {SHIRT_BACK_COPY_LINES[1]}
      </text>
      <text
        fill="#000000"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="140"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="610"
      >
        {SHIRT_BACK_COPY_LINES[2]}
      </text>
      <line
        stroke="#000000"
        strokeWidth="10"
        x1="180"
        x2="2220"
        y1="705"
        y2="705"
      />
      <rect
        fill="#ffffff"
        height="760"
        stroke="#000000"
        strokeWidth="18"
        width="760"
        x="820"
        y="900"
      />
      <g transform="translate(900 980)">
        <CampaignQrCode value={qrTarget} />
      </g>
      <text
        fill="#000000"
        fontFamily="'Courier New', monospace"
        fontSize={visibleTargetFontSize}
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="1850"
      >
        {visibleTargetLabel}
      </text>
    </svg>
  );
}

export default async function ShirtPage() {
  const sessionUser = await getSessionUser();
  const personalReferralHandle = getHandleOrReferralCode(sessionUser);
  const referralHandle = personalReferralHandle ?? "warondisease";
  const hasPersonalReferralUrl = Boolean(personalReferralHandle);
  const qrTarget = buildReferralUrl(
    referralHandle,
    WAR_ON_DISEASE_CANONICAL_ORIGIN,
  );
  const visibleTargetUrl = getVisibleTargetUrl(qrTarget);

  return (
    <Layout>
      <main className="shirt-root min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <style>{`
        .shirt-root {
          color-scheme: light;
        }

        @media print {
          nav,
          body > footer,
          [data-print-hidden="true"] {
            display: none !important;
          }

          html,
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }

          .shirt-root {
            padding: 0 !important;
          }

          .shirt-print-grid {
            display: block !important;
          }

          .shirt-print-grid figure {
            break-after: page;
            margin: 0 auto !important;
            width: 7.5in !important;
          }

          .shirt-print-grid figure:last-child {
            break-after: auto;
          }
        }
      `}</style>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <section className="space-y-6" data-print-hidden="true">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Walking billboard
                </p>
                <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
                  BUY THE T-SHIRT THAT ENDED WAR AND DISEASE.
                </h1>
                <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-foreground">
                  Wear the QR code outside, where the humans are. Terrifying
                  place. Necessary distribution channel. Your torso is not busy
                  enough.
                </p>
                <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
                  {hasPersonalReferralUrl ? (
                    <>The QR points to your campaign link.</>
                  ) : (
                    <>
                      Signed out: this uses the public campaign URL.{" "}
                      <Link
                        className="underline underline-offset-4"
                        href={ROUTES.signIn}
                      >
                        Sign in
                      </Link>{" "}
                      first if you want the QR to be yours.
                    </>
                  )}
                </p>
              </div>

              <section className="border-2 border-foreground bg-background p-5">
                <h2 className="text-2xl font-black uppercase leading-tight">
                  WEAR IT ON EARTH OPTIMIZATION DAY — AUGUST 6.
                </h2>
                <p className="mt-4 text-base font-bold leading-7 text-foreground">
                  If 1 billion humans wear this shirt on the same day, humanity
                  is forced to discuss the fact that it currently maintains
                  sufficient mass-murder capacity to cause{" "}
                  {/* valueOverride drops the parameter's "x" unit suffix, which
                      would otherwise read "122x apocalypses". */}
                  <ParameterValue
                    className="font-black"
                    param={NUCLEAR_WINTER_OVERKILL_FACTOR}
                    valueOverride={apocalypseCount}
                  />{" "}
                  apocalypses, and that it has the option to sacrifice one of
                  these apocalypses for disease eradication within our lifetime.
                </p>
                <Link
                  className="mt-4 inline-flex border border-foreground bg-background px-3 py-2 text-sm font-black text-foreground hover:bg-muted"
                  href={ROUTES.foundations}
                >
                  Foundations: see the bulk math → /foundations
                </Link>
              </section>

              {/*
                Optimitron gates this box behind SHIRT_COMMERCE_ENABLED and
                swaps in a Stripe order form when the store is open. The
                campaign app has no store, so it always renders the
                artwork-download branch — the same branch optimitron.com/shirt
                serves today, with the same copy.
              */}
              <div className="border-2 border-foreground bg-background p-5">
                <h2 className="text-lg font-black uppercase leading-tight">
                  Checkout is closed. The artwork ships now.
                </h2>
                <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                  Download the back artwork, print it, wear it today. No store
                  required.
                </p>
                <div className="mt-4">
                  <ShirtDownloadImageButton
                    filename="war-on-disease-shirt-back.png"
                    sourceId={SHIRT_BACK_ARTWORK_ID}
                  />
                </div>
              </div>

              <FixExistingShirtsSection />

              <section className="border-2 border-foreground bg-background p-5">
                <h2 className="text-2xl font-black uppercase leading-tight">
                  Not ready to buy? Pledge instead.
                </h2>
                <p className="mt-4 text-base font-bold leading-7 text-foreground">
                  If 8 billion others pledge by August 6, the bulk order ships.
                  If not, nothing happens. Your pledge is a promise, not a
                  charge.
                </p>
                <div className="mt-5 space-y-5">
                  <TaskFundingProgress taskId={PLEDGE_SHIRT_TASK_ID} />
                  <div className="border-2 border-foreground bg-background p-5">
                    <a
                      className="inline-flex border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                      href={OPTIMITRON_SHIRT_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Pledge on optimitron.com
                    </a>
                  </div>
                </div>
              </section>

              <div className="border-l-2 border-foreground pl-4 text-sm font-bold leading-relaxed text-muted-foreground">
                <p>Front: {CAMPAIGN_PRINT_COPY.shirtFrontLines.join(" ")}</p>
                <p className="mt-2">
                  Back: {SHIRT_BACK_COPY_LINES.join(" ")} Plus the per-buyer QR
                  code.
                </p>
              </div>
            </section>

            <section className="shirt-print-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <ArtworkPanel label="Front">
                <TshirtSilhouette label="Front of shirt">
                  <ShirtFrontArtwork />
                </TshirtSilhouette>
              </ArtworkPanel>
              <ArtworkPanel label="Back with QR">
                <TshirtSilhouette label="Back of shirt">
                  <ShirtBackArtwork
                    qrTarget={qrTarget}
                    visibleTargetUrl={visibleTargetUrl}
                  />
                </TshirtSilhouette>
              </ArtworkPanel>
            </section>
          </div>

          <p
            className="mt-8 border-t-2 border-foreground pt-5 text-base font-black leading-relaxed"
            data-print-hidden="true"
          >
            Want to coordinate with another human? Go on an{" "}
            {/* /missions has not been ported yet. Make this a relative Link
                once the campaign app serves it. */}
            <a
              className="underline decoration-dotted underline-offset-4"
              href={optimitronUrl(ROUTES.missions)}
              rel="noreferrer"
              target="_blank"
            >
              Earth Optimization Mission
            </a>
            .
          </p>
        </div>
      </main>
    </Layout>
  );
}
