import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import {
  PosterCopyLinkButton,
  PosterPrintButton,
  PosterQrCode,
} from "./poster-client";

const CAMPAIGN_ORIGIN = "https://warondisease.org";
const POSTER_FAVICON_SRC = "/site-assets/warondisease/warondisease-favicon.png";
const POSTER_HEADLINE_LINES = ["Take 30 seconds", "to end war", "and disease"];

type PaperSize = "letter" | "a4";

function normalizePaperSize(value: string | string[] | undefined): PaperSize {
  return value === "a4" ? "a4" : "letter";
}

function getVisibleTargetUrl(qrTarget: string) {
  return qrTarget.replace(/^https?:\/\//, "");
}

export default async function PosterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const paramsPromise: Promise<Record<string, string | string[] | undefined>> =
    searchParams ?? Promise.resolve({});
  const [params, session] = await Promise.all([
    paramsPromise,
    getServerSession(authOptions),
  ]);
  const hasPersonalReferralUrl = Boolean(
    session?.user?.handle?.trim() || session?.user?.referralCode?.trim(),
  );
  const qrTarget = buildUserReferralUrl(session?.user, CAMPAIGN_ORIGIN);
  const visibleTargetUrl = getVisibleTargetUrl(qrTarget);
  const paperSize = normalizePaperSize(params.paper);

  return (
    <section className="poster-root min-h-screen bg-[var(--treaty-paper)] px-4 py-8 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <style>{`
        .poster-root {
          color-scheme: light;
        }

        .poster-sheet {
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
        }

        .poster-favicon {
          display: block;
          width: clamp(3rem, 11vw, 0.95in);
          height: auto;
        }

        .poster-qr svg {
          display: block;
          width: min(42vw, 1.8in);
          height: auto;
        }

        @media print {
          @page {
            size: letter;
            margin: 0;
          }

          @page poster-letter {
            size: letter;
            margin: 0;
          }

          @page poster-a4 {
            size: A4;
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
            width: 100%;
            min-height: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }

          nav,
          body > footer,
          [data-print-hidden="true"] {
            display: none !important;
          }

          main {
            min-height: 0 !important;
          }

          .poster-root {
            min-height: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .poster-sheet {
            break-after: avoid;
            break-before: avoid;
            break-inside: avoid;
            box-sizing: border-box;
            margin: 0 auto !important;
            overflow: hidden;
            page: poster-letter;
            width: 8.5in !important;
            height: 11in !important;
            min-height: 11in !important;
            max-height: 11in !important;
            border-color: transparent !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .poster-sheet * {
            border-color: #000000 !important;
            color: #000000 !important;
          }

          .poster-headline {
            font-size: 0.88in !important;
          }

          .poster-sheet[data-paper-size="a4"] {
            page: poster-a4;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
          }

          .poster-sheet[data-paper-size="a4"] .poster-headline {
            font-size: 22mm !important;
          }

          .poster-qr svg {
            width: 1.65in !important;
            height: 1.65in !important;
          }

          .poster-qr {
            background: #ffffff !important;
          }

          .poster-favicon {
            width: 0.9in !important;
          }
        }
      `}</style>

      <div
        className="mx-auto mb-6 flex max-w-5xl flex-col gap-4"
        data-print-hidden="true"
      >
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black uppercase leading-none text-foreground sm:text-5xl md:text-6xl">
            Print your referral poster
          </h1>
          <p className="mt-3 max-w-2xl text-base font-bold leading-relaxed text-foreground sm:text-lg">
            Print it, tape it up, and share it. Every human who votes through
            your link earns you optimization points and moves humanity one
            click closer to ending war and disease.
          </p>
          {hasPersonalReferralUrl ? (
            <p className="mt-2 break-all text-sm font-bold text-muted-foreground">
              This poster uses your referral link: {visibleTargetUrl}
            </p>
          ) : (
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              This prints the generic campaign URL.{" "}
              <Link className="underline underline-offset-4" href={ROUTES.signIn}>
                Sign in
              </Link>{" "}
              to personalize the URL and QR code.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase text-foreground">
          <PosterPrintButton />
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
      </div>

      <article
        aria-label={`Printable War on Disease referral poster for ${visibleTargetUrl}`}
        className="poster-sheet mx-auto flex flex-col justify-between border-2 border-foreground bg-background p-[clamp(1.1rem,5vw,0.65in)] text-foreground"
        data-paper-size={paperSize}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center py-[clamp(1rem,4vw,0.45in)] text-center">
          <h2 className="poster-headline text-[clamp(3.25rem,11vw,6.15rem)] font-normal uppercase leading-[0.96] tracking-normal text-foreground">
            {POSTER_HEADLINE_LINES.map((line) => (
              <span className="poster-headline-line" key={line}>
                {line}
              </span>
            ))}
          </h2>
        </div>

        <footer className="grid items-end gap-[clamp(0.8rem,3vw,0.28in)] sm:grid-cols-[auto_1fr_auto]">
          <img
            alt=""
            aria-hidden="true"
            className="poster-favicon"
            height={512}
            src={POSTER_FAVICON_SRC}
            width={512}
          />
          <div className="min-w-0">
            <p className="text-[clamp(0.8rem,2vw,0.2in)] font-bold uppercase leading-none text-muted-foreground">
              Scan or type
            </p>
            <p className="mt-2 break-all text-[clamp(1.35rem,4.2vw,0.44in)] font-bold uppercase leading-none text-foreground">
              {visibleTargetUrl}
            </p>
          </div>
          <div className="poster-qr w-fit border-2 border-foreground bg-background p-[clamp(0.45rem,2vw,0.15in)]">
            <PosterQrCode value={qrTarget} />
          </div>
        </footer>
      </article>
    </section>
  );
}
