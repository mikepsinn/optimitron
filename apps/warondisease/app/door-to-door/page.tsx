import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  shareableSnippets,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import Layout from "@/components/layout";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { CampaignQrCode } from "@/components/sharing/campaign-qr-code";
import { getSessionUser } from "@/lib/auth-utils";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl } from "@/lib/url";
import {
  PosterCopyLinkButton,
  PosterPrintButton,
} from "../poster/poster-client";

const CAMPAIGN_ORIGIN = "https://warondisease.org";
const SIGNATURE_ROW_COUNT = 10;

export const metadata: Metadata = {
  title: "Go Door to Door",
  description:
    "The referendum lives on the internet, but some presidents of Earth still answer the door instead. Print the YES sheet, read the twenty-second pitch, and register the neighbors the internet has not reached. Every scan of your code counts instantly — and credits you.",
};

type PaperSize = "letter" | "a4";

function normalizePaperSize(value: string | string[] | undefined): PaperSize {
  return value === "a4" ? "a4" : "letter";
}

export default async function DoorToDoorPage({
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
  const hasPersonalReferralUrl = Boolean(
    sessionUser?.handle?.trim() || sessionUser?.referralCode?.trim(),
  );
  const qrTarget = buildUserReferralUrl(sessionUser, CAMPAIGN_ORIGIN);
  const visibleTargetUrl = qrTarget.replace(/^https?:\/\//, "");
  const paperSize = normalizePaperSize(params.paper);

  return (
    <Layout>
      <section className="canvass-root min-h-screen bg-[var(--treaty-paper)] px-4 py-8 text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <style>{`
          .canvass-root {
            color-scheme: light;
          }

          .canvass-sheet {
            container-type: inline-size;
            width: min(100%, 8.5in);
            min-height: 11in;
            overflow: hidden;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .canvass-sheet[data-paper-size="a4"] {
            width: min(100%, 210mm);
            min-height: 297mm;
          }

          .canvass-kicker {
            font-size: clamp(0.7rem, 2.4cqw, 0.19in);
            letter-spacing: 0.14em;
          }

          .canvass-headline {
            font-size: clamp(1.7rem, 7.4cqw, 0.62in);
            line-height: 1.02;
          }

          .canvass-subtitle {
            font-size: clamp(0.78rem, 2.7cqw, 0.2in);
          }

          .canvass-pitch-label {
            font-size: clamp(0.66rem, 2.2cqw, 0.16in);
            letter-spacing: 0.12em;
          }

          .canvass-pitch {
            font-size: clamp(0.85rem, 3cqw, 0.21in);
            line-height: 1.45;
          }

          .canvass-consent {
            font-size: clamp(0.62rem, 2.1cqw, 0.15in);
            line-height: 1.4;
          }

          .canvass-table th {
            font-size: clamp(0.58rem, 2cqw, 0.14in);
            letter-spacing: 0.1em;
          }

          .canvass-row td {
            height: clamp(2.1rem, 7cqw, 0.48in);
          }

          .canvass-row-number {
            font-size: clamp(0.7rem, 2.4cqw, 0.16in);
          }

          .canvass-qr svg {
            display: block;
            width: min(30cqw, 1.7in);
            height: auto;
          }

          .canvass-qr-float {
            float: right;
            margin: 0 0 clamp(0.3rem, 1.5cqw, 0.1in) clamp(0.6rem, 3cqw, 0.2in);
            text-align: center;
            width: fit-content;
          }

          .canvass-back-headline {
            font-size: clamp(1.1rem, 4.4cqw, 0.34in);
            line-height: 1.05;
          }

          .canvass-treaty-text {
            column-width: 2.3in;
            column-gap: clamp(0.8rem, 3.5cqw, 0.24in);
            column-rule: 1px solid var(--treaty-ink-muted, currentColor);
            font-size: clamp(0.6rem, 1.9cqw, 0.12in);
            line-height: 1.3;
          }

          .canvass-treaty-text p,
          .canvass-treaty-text ul,
          .canvass-treaty-text ol,
          .canvass-treaty-text blockquote {
            margin: 0 0 0.45em;
          }

          .canvass-treaty-text h1,
          .canvass-treaty-text h2,
          .canvass-treaty-text h3,
          .canvass-treaty-text h4 {
            font-size: 1.12em;
            font-weight: 900;
            line-height: 1.15;
            margin: 0.7em 0 0.3em;
            text-transform: uppercase;
          }

          .canvass-treaty-text a {
            color: inherit;
            text-decoration: underline;
          }

          .canvass-scan-label {
            font-size: clamp(0.6rem, 2.1cqw, 0.15in);
            letter-spacing: 0.12em;
          }

          .canvass-url {
            font-size: clamp(0.68rem, 2.3cqw, 0.17in);
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .canvass-collector {
            font-size: clamp(0.66rem, 2.2cqw, 0.16in);
          }

          @media print {
            @page {
              size: letter;
              margin: 0;
            }

            @page canvass-letter {
              size: letter;
              margin: 0;
            }

            @page canvass-a4 {
              size: A4;
              margin: 0;
            }

            /*
             * Hardcoded #ffffff / #000000 in @media print is intentional:
             * CSS custom properties do NOT reliably resolve in browser
             * print engines. CLAUDE.md bans hex on SCREEN treaty surfaces
             * but allows it for output stages like @media print and email
             * markup (same reasoning as /poster and /shirt).
             */
            html,
            body {
              width: 100%;
              min-height: 100%;
              background: #ffffff !important;
              color: #000000 !important;
              overflow: visible !important;
            }

            /*
             * "body > footer" never matched the shared Layout's footer, which
             * sits inside a wrapper div, and the nav is inside the sticky
             * header. Both chrome sections were printing around the canvass
             * sheets. The sheet's own collector footer stays.
             */
            header,
            nav,
            footer:not(.canvass-collector),
            [data-print-hidden="true"] {
              display: none !important;
            }

            main {
              min-height: 0 !important;
            }

            .canvass-root {
              min-height: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }

            .canvass-sheet {
              break-after: avoid;
              break-before: avoid;
              break-inside: avoid;
              box-sizing: border-box;
              margin: 0 auto !important;
              overflow: hidden;
              page: canvass-letter;
              width: 8.5in !important;
              height: 11in !important;
              min-height: 11in !important;
              max-height: 11in !important;
              border-color: transparent !important;
              background: #ffffff !important;
              color: #000000 !important;
            }

            .canvass-sheet * {
              border-color: #000000 !important;
              color: #000000 !important;
            }

            .canvass-sheet {
              gap: 0.14in !important;
              padding: 0.4in !important;
            }

            .canvass-sheet-back {
              break-before: page;
              display: block;
              margin-top: 0 !important;
              padding: 0.35in !important;
            }

            .canvass-back-headline {
              font-size: 0.26in !important;
            }

            .canvass-treaty-text {
              column-count: 3 !important;
              column-width: auto !important;
              font-size: 0.098in !important;
              line-height: 1.26 !important;
              column-gap: 0.2in !important;
            }

            .canvass-qr-float {
              margin: 0 0 0.08in 0.16in !important;
            }

            /* 296mm (not 297mm): Chrome pixel rounding on exact-A4 sheets
               spills a blank third page. */
            .canvass-sheet[data-paper-size="a4"] {
              page: canvass-a4;
              width: 210mm !important;
              height: 296mm !important;
              min-height: 296mm !important;
              max-height: 296mm !important;
            }

            .canvass-kicker {
              font-size: 0.15in !important;
            }

            .canvass-headline {
              font-size: 0.46in !important;
            }

            .canvass-subtitle {
              font-size: 0.16in !important;
            }

            .canvass-pitch-label {
              font-size: 0.12in !important;
            }

            .canvass-pitch {
              font-size: 0.17in !important;
            }

            .canvass-consent {
              font-size: 0.12in !important;
            }

            .canvass-table th {
              font-size: 0.11in !important;
            }

            .canvass-row td {
              height: 0.4in !important;
            }

            .canvass-row-number {
              font-size: 0.14in !important;
            }

            .canvass-qr svg {
              width: 1.35in !important;
              height: 1.35in !important;
            }

            .canvass-qr {
              background: #ffffff !important;
            }

            .canvass-scan-label {
              font-size: 0.13in !important;
            }

            .canvass-url {
              font-size: 0.15in !important;
            }

            .canvass-collector {
              font-size: 0.14in !important;
            }
          }
        `}</style>

        <div
          className="mx-auto mb-6 flex max-w-5xl flex-col gap-4"
          data-print-hidden="true"
        >
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black uppercase leading-none text-foreground sm:text-5xl md:text-6xl">
              Go door to door
            </h1>
            <p className="mt-3 max-w-2xl text-base font-bold leading-relaxed text-foreground sm:text-lg">
              Print the YES sheet, knock, and read the pitch aloud. It takes
              twenty seconds. Neighbors with phones scan your code and their
              vote counts instantly — with referral credit to you. Neighbors
              without phones sign the paper. Photograph finished sheets and
              keep them; the campaign verifies each signer digitally.
            </p>
            {hasPersonalReferralUrl ? (
              <p className="mt-2 break-all text-sm font-bold text-muted-foreground">
                This sheet uses your referral link: {visibleTargetUrl}
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
                href={ROUTES.doorToDoor}
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
                href={`${ROUTES.doorToDoor}?paper=a4`}
              >
                A4
              </Link>
            </div>
          </div>
        </div>

        <article
          aria-label={`Printable 1% Treaty signature sheet for ${visibleTargetUrl}`}
          className="canvass-sheet mx-auto flex flex-col gap-[clamp(0.7rem,3cqw,0.24in)] border-2 border-foreground bg-background p-[clamp(1rem,5vw,0.5in)] text-foreground"
          data-paper-size={paperSize}
        >
          <header className="text-center">
            <p className="canvass-kicker font-bold uppercase text-muted-foreground">
              International Campaign to End War and Disease
            </p>
            <h2 className="canvass-headline mt-1 font-black uppercase">
              Vote yes on the 1% Treaty
            </h2>
            <p className="canvass-subtitle mt-1 font-bold">
              Paper edition of the treaty register — for humans the internet
              has not reached yet.
            </p>
          </header>

          <div className="border-2 border-foreground p-[clamp(0.6rem,3cqw,0.22in)]">
            <p className="canvass-pitch-label font-black uppercase text-muted-foreground">
              Read this aloud. It takes twenty seconds.
            </p>
            <div className="canvass-qr-float">
              <div className="canvass-qr w-fit border-2 border-foreground bg-background p-[clamp(0.2rem,1.2cqw,0.08in)]">
                <CampaignQrCode value={qrTarget} />
              </div>
              <p className="canvass-scan-label mt-1 font-black uppercase text-muted-foreground">
                Scan or type
              </p>
              <p className="canvass-url font-bold uppercase">{visibleTargetUrl}</p>
            </div>
            <p className="canvass-pitch mt-2 font-bold">
                &ldquo;Governments spend{" "}
                <ParameterValue
                  param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                  presentation="inline"
                  valueOverride="604"
                />{" "}
                times more on weapons than on the clinical trials that find out
                which medicines actually work. The 1% Treaty redirects{" "}
                <ParameterValue
                  param={TREATY_REDUCTION_PCT}
                  presentation="inline"
                  valueOverride="1%"
                />{" "}
                of every military budget —{" "}
                <ParameterValue
                  param={TREATY_ANNUAL_FUNDING}
                  presentation="inline"
                  valueOverride="$27.2 billion"
                />{" "}
                a year — to curing diseases. Nobody&rsquo;s military gets
                weaker, because every country cuts the same{" "}
                <ParameterValue
                  param={TREATY_REDUCTION_PCT}
                  presentation="inline"
                  valueOverride="1%"
                />
                . The wait for first treatments drops from{" "}
                <ParameterValue
                  param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                  valueOverride="443"
                />{" "}
                years to{" "}
                <ParameterValue
                  param={DFDA_QUEUE_CLEARANCE_YEARS}
                  presentation="inline"
                  valueOverride="36"
                />
                . Scan the code to vote YES in 30 seconds — or sign here and
                confirm later.&rdquo;
            </p>
          </div>

          <p className="canvass-consent font-bold text-muted-foreground">
            Signing below casts a YES vote on the 1% Treaty on the public treaty
            register at warondisease.org. The campaign contacts you only to
            verify your vote. One vote per human. Full treaty text:
            1percenttreaty.org.
          </p>

          <table className="canvass-table w-full table-fixed border-collapse border-2 border-foreground">
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[33%]" />
              <col className="w-[35%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-foreground px-2 py-1 text-left font-black uppercase">
                  #
                </th>
                <th className="border border-foreground px-2 py-1 text-left font-black uppercase">
                  Printed name
                </th>
                <th className="border border-foreground px-2 py-1 text-left font-black uppercase">
                  Email or mobile
                </th>
                <th className="border border-foreground px-2 py-1 text-left font-black uppercase">
                  Signature
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SIGNATURE_ROW_COUNT }, (_, index) => (
                <tr className="canvass-row" key={index}>
                  <td className="canvass-row-number border border-foreground px-2 font-bold text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="border border-foreground" />
                  <td className="border border-foreground" />
                  <td className="border border-foreground" />
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="canvass-collector flex flex-col gap-1 font-bold">
            <p>Collected by _______________________________________</p>
            <p>Date _______________</p>
            <p className="text-muted-foreground">
              Photograph finished sheets. Keep the paper. Every signer is
              verified digitally — no signature is wasted.
            </p>
          </footer>
        </article>

        <article
          aria-label="The 1% Treaty, full text (back of sheet)"
          className="canvass-sheet canvass-sheet-back mx-auto mt-8 border-2 border-foreground bg-background p-[clamp(1rem,5vw,0.5in)] text-foreground print:mt-0"
          data-paper-size={paperSize}
        >
          <header className="mb-[clamp(0.5rem,2cqw,0.16in)] text-center">
            <p className="canvass-kicker font-bold uppercase text-muted-foreground">
              Back of sheet — print double-sided
            </p>
            <h2 className="canvass-back-headline font-black uppercase">
              The 1% Treaty — full text
            </h2>
          </header>
          <div className="canvass-treaty-text">
            {/* Default markdown elements on purpose: readerMarkdownComponents
                carries the /treaty reading-page drop caps and type scale,
                which overflow a fixed-height print sheet. */}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {shareableSnippets.onePercentTreatyText.markdown}
            </ReactMarkdown>
          </div>
        </article>
      </section>
    </Layout>
  );
}
