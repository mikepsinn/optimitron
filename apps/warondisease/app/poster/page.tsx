import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { NUCLEAR_WINTER_OVERKILL_FACTOR } from "@optimitron/data/parameters";
import Layout from "@/components/layout";
import { CampaignQrCode } from "@/components/sharing/campaign-qr-code";
import { getSessionUser } from "@/lib/auth-utils";
import { CAMPAIGN_PRINT_COPY } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import {
  FlyerRoutePromptCopyButton,
  PosterCopyLinkButton,
  PosterHangNearbyPanel,
  PosterPrintButton,
} from "./poster-client";

const apocalypseCount = Math.round(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value,
).toLocaleString("en-US");

const CAMPAIGN_ORIGIN = "https://warondisease.org";
const POSTER_FAVICON_SRC = "/site-assets/warondisease/warondisease-favicon.png";
const FLYER_ROUTE_PROMPT =
  "Plan a one-hour flyer route for me. Use my current location if you have it. Otherwise, ask for my neighborhood or ZIP code. Find nearby places likely to permit community flyers, such as libraries, coffee shops, community centers, campuses, laundromats, grocery stores, clinics, and public bulletin boards. Rank them by likely permission, foot traffic, opening hours, and travel time. Put them in the best order to visit. Include each address and tell me whom to ask before posting. Do not recommend posting anywhere without permission.";

export const metadata: Metadata = {
  title: "Hang Up Flyers",
  description: `Every human on earth would be vastly richer and significantly less dead if we agreed to sacrifice one of our ${apocalypseCount} apocalypse capacity for disease eradication. Hang referral flyers where humans will see them and let nearby foot traffic recruit voters while you do something else.`,
};

type PaperSize = "letter" | "a4";

function normalizePaperSize(value: string | string[] | undefined): PaperSize {
  return value === "a4" ? "a4" : "letter";
}

function getVisibleTargetUrl(qrTarget: string) {
  return qrTarget.replace(/^https?:\/\//, "");
}

function getPosterUrlStyle(visibleTargetUrl: string): CSSProperties {
  const normalizedLength = Math.max(visibleTargetUrl.length, 1);
  const fontCqw = Math.min(7.9, Math.max(3, 130 / normalizedLength));

  return {
    "--poster-url-font-size": `${fontCqw.toFixed(2)}cqw`,
    whiteSpace: normalizedLength <= 42 ? "nowrap" : undefined,
  } as CSSProperties;
}

export default async function PosterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const paramsPromise: Promise<Record<string, string | string[] | undefined>> =
    searchParams ?? Promise.resolve({});
  const [params, sessionUser] = await Promise.all([
    paramsPromise,
    getSessionUser(),
  ]);
  const sessionUserId = sessionUser?.id ?? null;
  const hasPersonalReferralUrl = Boolean(
    sessionUser?.handle?.trim() || sessionUser?.referralCode?.trim(),
  );
  const qrTarget = buildUserReferralUrl(sessionUser, CAMPAIGN_ORIGIN);
  const visibleTargetUrl = getVisibleTargetUrl(qrTarget);
  const visibleTargetUrlStyle = getPosterUrlStyle(visibleTargetUrl);
  const paperSize = normalizePaperSize(params.paper);

  return (
    <Layout>
      <section className="poster-root min-h-screen bg-[var(--treaty-paper)] px-4 py-8 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <style>{`
          .poster-root {
            color-scheme: light;
          }

          .poster-sheet {
            container-type: inline-size;
            width: min(100%, 8.5in);
            min-height: 11in;
            overflow: hidden;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .poster-sheet[data-paper-size="a4"] {
            width: min(100%, 210mm);
            min-height: 297mm;
          }

          .poster-headline-line {
            display: block;
            font-weight: 900;
            line-height: 1.06;
            white-space: nowrap;
            width: 100%;
          }

          .poster-headline-line-0 {
            font-size: clamp(2.45rem, 12cqw, 6rem);
          }

          .poster-headline-line-1 {
            font-size: clamp(2.65rem, 13.1cqw, 6.55rem);
          }

          .poster-headline-line-2 {
            font-size: clamp(4.15rem, 15.6cqw, 7.8rem);
          }

          .poster-headline-line-3 {
            font-size: clamp(1.9rem, 8.5cqw, 4.25rem);
          }

          .poster-qr svg {
            display: block;
            width: min(56cqw, 3.15in);
            height: auto;
          }

          .poster-qr-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(0.7rem, 4.5cqw, 0.36in);
          }

          .poster-favicon {
            display: block;
            width: clamp(3.35rem, 15cqw, 1.35in);
            height: auto;
          }

          .poster-visible-url {
            font-size: clamp(1.35rem, var(--poster-url-font-size), 0.7in);
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .poster-footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            align-self: center;
            gap: clamp(0.85rem, 3.5cqw, 0.3in);
            text-align: center;
            width: 100cqw;
          }

          .poster-url-label {
            font-size: clamp(1.05rem, 3.8cqw, 0.3in);
          }

          @media print {
            /*
             * One unnamed @page only. Named CSS pages (page: poster-letter)
             * plus an exact 11in/297mm sheet make Chrome print preview emit a
             * blank trailing page when margins or pixel rounding disagree with
             * the box. Keep sheet boxes a hair under the page size — same
             * approach as the existing A4 296mm clamp.
             */
            @page {
              size: ${paperSize === "a4" ? "A4" : "letter"};
              margin: 0;
            }

            /*
             * Hardcoded #ffffff / #000000 in @media print is intentional:
             * CSS custom properties (var(--background), etc) do NOT
             * reliably resolve in browser print engines (Chrome strips
             * them when print-color-adjust is the default; Safari's
             * print pipeline is its own thing). CLAUDE.md bans hex on
             * SCREEN treaty surfaces but allows it for output stages
             * like @media print and email markup (see "Visual Style
             * Rules" exception for emails — same reasoning applies).
             */
            html,
            body {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              overflow: hidden !important;
            }

            nav,
            footer:not(.poster-footer),
            [data-print-hidden="true"] {
              display: none !important;
            }

            main,
            .poster-root {
              display: block !important;
              width: auto !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: #ffffff !important;
              color: #000000 !important;
            }

            .poster-sheet {
              break-after: avoid;
              break-before: avoid;
              break-inside: avoid;
              box-sizing: border-box;
              margin: 0 !important;
              overflow: hidden !important;
              width: 8.5in !important;
              /* 10.95in (not 11in): Chrome pixel rounding on exact-letter
                 sheets spills a blank trailing page. */
              height: 10.95in !important;
              min-height: 10.95in !important;
              max-height: 10.95in !important;
              border: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }

            .poster-sheet * {
              border-color: #000000 !important;
              color: #000000 !important;
            }

            .poster-headline {
              font-size: unset !important;
            }

            .poster-headline-line-0 {
              font-size: 0.94in !important;
            }

            .poster-headline-line-1 {
              font-size: 1in !important;
            }

            .poster-headline-line-2 {
              font-size: 1.42in !important;
            }

            .poster-headline-line-3 {
              font-size: 0.68in !important;
            }

            /* 296mm (not 297mm): Chrome pixel rounding on exact-A4 sheets
               spills a blank trailing page. */
            .poster-sheet[data-paper-size="a4"] {
              width: 210mm !important;
              height: 296mm !important;
              min-height: 296mm !important;
              max-height: 296mm !important;
            }

            .poster-sheet[data-paper-size="a4"] .poster-headline {
              font-size: unset !important;
            }

            .poster-sheet[data-paper-size="a4"] .poster-headline-line-0 {
              font-size: 22.5mm !important;
            }

            .poster-sheet[data-paper-size="a4"] .poster-headline-line-1 {
              font-size: 24.1mm !important;
            }

            .poster-sheet[data-paper-size="a4"] .poster-headline-line-2 {
              font-size: 34.3mm !important;
            }

            .poster-sheet[data-paper-size="a4"] .poster-headline-line-3 {
              font-size: 16.8mm !important;
            }

            .poster-qr svg {
              width: 2.95in !important;
              height: 2.95in !important;
            }

            .poster-qr {
              background: #ffffff !important;
            }

            .poster-favicon {
              width: 1.25in !important;
            }

          }
        `}</style>

        <div
          className="mx-auto mb-6 flex max-w-5xl flex-col gap-4"
          data-print-hidden="true"
        >
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black uppercase leading-none text-foreground sm:text-5xl md:text-6xl">
              Hang up flyers
            </h1>
            <p className="mt-3 max-w-2xl text-base font-bold leading-relaxed text-foreground sm:text-lg">
              Print these flyers and put them where humans will see them. Every
              human who votes through your link earns you optimization points and
              moves humanity one click closer to ending war and disease.
            </p>
            <p className="mt-3 text-sm font-bold text-foreground">
              Going door to door?{" "}
              <Link
                className="underline underline-offset-4"
                href={ROUTES.doorToDoor}
              >
                Print the YES signature sheet
              </Link>{" "}
              instead.
            </p>
            {hasPersonalReferralUrl ? (
              <p className="mt-2 break-all text-sm font-bold text-muted-foreground">
                These flyers use your referral link: {visibleTargetUrl}
              </p>
            ) : (
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                This prints the generic campaign URL.{" "}
                <Link
                  className="underline underline-offset-4"
                  href={ROUTES.signIn}
                >
                  Sign in
                </Link>{" "}
                to personalize the URL and QR code.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase text-foreground">
            <PosterPrintButton label="Print flyers" />
            <PosterCopyLinkButton value={qrTarget} />
            <div className="flex items-center gap-2">
              <Link
                aria-current={paperSize === "letter" ? "page" : undefined}
                className={`border-2 border-foreground px-3 py-2 ${
                  paperSize === "letter"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
                href={ROUTES.poster}
              >
                Letter
              </Link>
              <Link
                aria-current={paperSize === "a4" ? "page" : undefined}
                className={`border-2 border-foreground px-3 py-2 ${
                  paperSize === "a4"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
                href={`${ROUTES.poster}?paper=a4`}
              >
                A4
              </Link>
            </div>
          </div>

          <PosterHangNearbyPanel signedIn={Boolean(sessionUserId)} />

          <div className="mt-2 max-w-3xl border-t border-foreground pt-5">
            <h2 className="text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
              Make your AI plan the route
            </h2>
            <p className="mt-2 max-w-2xl font-bold leading-relaxed text-foreground">
              Your AI can make the list. You can operate tape. Copy this prompt
              and let it put nearby places in a useful order.
            </p>
            <blockquote className="my-4 border-l-2 border-foreground pl-4 text-sm font-bold leading-relaxed text-foreground sm:text-base">
              {FLYER_ROUTE_PROMPT}
            </blockquote>
            <FlyerRoutePromptCopyButton value={FLYER_ROUTE_PROMPT} />
          </div>
        </div>

        <article
          aria-label={`Printable War on Disease referral flyer for ${visibleTargetUrl}`}
          className="poster-sheet mx-auto flex flex-col justify-center gap-[clamp(1.35rem,6vw,0.82in)] border-2 border-foreground bg-background p-[clamp(1rem,5vw,0.62in)] text-foreground"
          data-paper-size={paperSize}
        >
          <div className="flex min-h-0 items-center justify-center text-center">
            <h2 className="poster-headline w-full max-w-full uppercase tracking-normal text-foreground">
              {CAMPAIGN_PRINT_COPY.flyerHeadlineLines.map((line, index) => (
                <span
                  className={`poster-headline-line poster-headline-line-${index}`}
                  key={line}
                >
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <footer className="poster-footer">
            <div className="poster-qr-row">
              <img
                alt=""
                aria-hidden="true"
                className="poster-favicon"
                height={512}
                src={POSTER_FAVICON_SRC}
                width={512}
              />
              <div className="poster-qr w-fit border-2 border-foreground bg-background p-[clamp(0.45rem,2vw,0.15in)]">
                <CampaignQrCode value={qrTarget} />
              </div>
              <img
                alt=""
                aria-hidden="true"
                className="poster-favicon"
                height={512}
                src={POSTER_FAVICON_SRC}
                width={512}
              />
            </div>
            <div className="min-w-0">
              <p className="poster-url-label font-bold uppercase leading-none text-muted-foreground">
                Scan or type
              </p>
              <p
                className="poster-visible-url mt-2 font-bold uppercase leading-none text-foreground"
                style={visibleTargetUrlStyle}
              >
                {visibleTargetUrl}
              </p>
            </div>
          </footer>
        </article>
      </section>
    </Layout>
  );
}
