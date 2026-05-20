import { getServerSession } from "next-auth";
import Link from "next/link";
import type { ReactNode } from "react";
import { SHARING_TIME_MINUTES } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { PosterQrCode } from "@/app/poster/poster-client";
import { authOptions } from "@/lib/auth";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { serverEnv } from "@/lib/env";
import { CAMPAIGN_PRINT_COPY, SHIRT_BACK_COPY_LINES } from "@/lib/messaging";
import { getRouteMetadata } from "@/lib/metadata";
import { ROUTES, shirtLink } from "@/lib/routes";
import { buildReferralUrl } from "@/lib/url";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { ShirtDownloadImageButton, ShirtOrderForm } from "./shirt-client";

export const metadata = getRouteMetadata(shirtLink);

const SHIRT_BACK_ARTWORK_ID = "war-on-disease-shirt-back";
const VISIBLE_TARGET_MIN_FONT_SIZE = 10;

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
      Math.floor(maxWidth / Math.max(text.length * 0.62, 1)),
    ),
  );
}

function VoteTimeValue({ className }: { className?: string }) {
  return (
    <ParameterValue
      className={className}
      param={SHARING_TIME_MINUTES}
      presentation="inline"
      valueOverride="30 seconds"
    />
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

function ShirtFrontArtwork() {
  const [pleaseTake, , toEnd, warAndDisease, atText, urlText] =
    CAMPAIGN_PRINT_COPY.shirtFrontLines;

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
      <foreignObject height="2760" width="2160" x="120" y="120">
        <div
          style={{
            alignItems: "center",
            boxSizing: "border-box",
            color: "#000000",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Georgia, 'Times New Roman', serif",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            textTransform: "uppercase",
            width: "100%",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              lineHeight: "0.9",
              padding: "32px 0",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "275px", whiteSpace: "nowrap" }}>
              {pleaseTake}
            </div>
            <div style={{ fontSize: "300px", whiteSpace: "nowrap" }}>
              <VoteTimeValue />
            </div>
            <div style={{ fontSize: "380px", whiteSpace: "nowrap" }}>
              {toEnd}
            </div>
            <div style={{ fontSize: "220px", whiteSpace: "nowrap" }}>
              {warAndDisease}
            </div>
            <div style={{ fontSize: "380px", whiteSpace: "nowrap" }}>
              {atText}
            </div>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "190px",
                letterSpacing: "0",
                whiteSpace: "nowrap",
              }}
            >
              {urlText}
            </div>
          </div>
        </div>
      </foreignObject>
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
    2040,
    92,
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
        fontSize="168"
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
        fontSize="144"
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
        fontSize="168"
        fontWeight="900"
        textAnchor="middle"
        x="1200"
        y="610"
      >
        {SHIRT_BACK_COPY_LINES[2]}
      </text>
      <line stroke="#000000" strokeWidth="10" x1="180" x2="2220" y1="705" y2="705" />
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
        <PosterQrCode value={qrTarget} />
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
  const session = await getServerSession(authOptions);
  const personalReferralHandle = getHandleOrReferralCode(session?.user);
  const referralHandle = personalReferralHandle ?? "warondisease";
  const hasPersonalReferralUrl = Boolean(personalReferralHandle);
  const qrTarget = buildReferralUrl(
    referralHandle,
    WAR_ON_DISEASE_CANONICAL_ORIGIN,
  );
  const visibleTargetUrl = getVisibleTargetUrl(qrTarget);
  const shirtCommerceEnabled =
    serverEnv.SHIRT_COMMERCE_ENABLED === "1" ||
    serverEnv.SHIRT_COMMERCE_ENABLED === "true";

  return (
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
                Make the shirt
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

            {shirtCommerceEnabled ? (
              <ShirtOrderForm handle={referralHandle} />
            ) : (
              <div className="border-2 border-foreground bg-background p-5">
                <h2 className="text-lg font-black uppercase leading-tight">
                  Shirt checkout is closed
                </h2>
                <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                  You can still download the back artwork while checkout is
                  off.
                </p>
                <div className="mt-4">
                  <ShirtDownloadImageButton
                    filename="war-on-disease-shirt-back.png"
                    sourceId={SHIRT_BACK_ARTWORK_ID}
                  />
                </div>
              </div>
            )}

            <div className="border-l-2 border-foreground pl-4 text-sm font-bold leading-relaxed text-muted-foreground">
              <p>
                Front: please take <VoteTimeValue /> to end war and disease at
                warondisease.org.
              </p>
              <p className="mt-2">
                Back: trade one apocalypse for disease eradication at
                warondisease.org.
              </p>
            </div>
          </section>

          <section className="shirt-print-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <ArtworkPanel label="Front">
              <ShirtFrontArtwork />
            </ArtworkPanel>
            <ArtworkPanel label="Back with referral QR">
              <ShirtBackArtwork
                qrTarget={qrTarget}
                visibleTargetUrl={visibleTargetUrl}
              />
            </ArtworkPanel>
          </section>
        </div>
      </div>
    </main>
  );
}
