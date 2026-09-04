import type { Metadata } from "next";
import { COURT_OF_HUMANITY_TEXT } from "@optimitron/data/referendums";
import Layout from "@/components/layout";
import { JsonLdScript } from "@/components/site/JsonLdScript";
import { buildCourtStructuredData } from "@/lib/campaign-structured-data";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site-config";
import { CourtCaseText } from "./court-case-text";
import { CourtJoinSignatureBox } from "./CourtJoinSignatureBox";

export const dynamic = "force-dynamic";

const COURT_PAGE_TITLE = "Join the Court of Humanity";
const COURT_PAGE_DESCRIPTION =
  "Join the Court of Humanity to inspect cases and evidence and cast verified human verdicts.";

const siteOg = getSiteConfig().ogMetadata;

export const metadata: Metadata = {
  title: COURT_PAGE_TITLE,
  description: COURT_PAGE_DESCRIPTION,
  alternates: {
    canonical: ROUTES.court,
  },
  openGraph: {
    title: COURT_PAGE_TITLE,
    description: COURT_PAGE_DESCRIPTION,
    images: [
      {
        url: siteOg.image,
        width: siteOg.width,
        height: siteOg.height,
        alt: siteOg.alt || COURT_PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COURT_PAGE_TITLE,
    description: COURT_PAGE_DESCRIPTION,
    images: [siteOg.image],
  },
};

interface CourtPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * `/court` — the Court of Humanity membership declaration and join form.
 */
export default async function CourtPage({ searchParams }: CourtPageProps) {
  const params = await searchParams;
  const referralCode = typeof params.ref === "string" ? params.ref : null;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <JsonLdScript data={buildCourtStructuredData()} />
        <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Public membership
          </p>
          <h1 className="mt-3 text-3xl font-black leading-[1.15] text-foreground sm:text-4xl">
            Join the Court of Humanity
          </h1>

          <article className="mt-8 border-2 border-foreground bg-background p-5 sm:p-8">
            <CourtCaseText markdown={COURT_OF_HUMANITY_TEXT.markdown} />
          </article>

          <section id="sign-below-court" className="mt-12 pb-4">
            <CourtJoinSignatureBox referralCode={referralCode} />
          </section>
        </main>
      </div>
    </Layout>
  );
}
