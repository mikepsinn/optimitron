import { headers } from "next/headers";
import Link from "next/link";
import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  shareableSnippets,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TreatyContent } from "@/components/treaty/TreatyContent";
import type { ReferendumSiteLegalSection } from "@/content/referendum-sites/types";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSiteMetadata } from "@/lib/metadata";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { EndorseForm } from "./EndorseForm";
import { OrganizationImpactCalculator } from "./OrganizationImpactCalculator";

export const dynamic = "force-dynamic";

const HOUR_ACTIONS = [
  {
    title: "Embed the iframe",
    body: "One paste, then it works while you sleep.",
  },
  {
    title: "Send one email",
    body: "Pre-written. Your members already trust you. That is the asset.",
  },
  {
    title: "Post once per channel",
    body: "Link auto-credits responses to your organization.",
  },
] as const;

function TreatyTextDisclosure({
  treatyMarkdown,
}: {
  treatyMarkdown: string | null;
}) {
  if (!treatyMarkdown) return null;

  return (
    <details
      className="mt-10 border-t border-foreground pt-8"
      id="organization-treaty-text"
    >
      <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.14em] text-foreground marker:text-foreground">
        Read the 1% Treaty text
      </summary>
      <div className="mt-8">
        <TreatyContent
          bodyMarkdown={treatyMarkdown}
          className="max-w-2xl"
          showCourtCta={false}
          showInlineSign={false}
        />
        <div className="mt-6 flex justify-center">
          <a
            href="#organization-endorsement-form"
            className="inline-block border-2 border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          >
            Join as Organization
          </a>
        </div>
      </div>
    </details>
  );
}

function LegalNotesDisclosure({
  sections,
}: {
  sections: ReferendumSiteLegalSection[];
}) {
  return (
    <details
      className="mt-8 border-2 border-foreground bg-background p-5"
      id="organization-legal-notes"
    >
      <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-foreground marker:text-foreground">
        Legal notes for organizations
      </summary>
      <div className="mt-5 border-t border-foreground pt-5">
        <p className="max-w-3xl text-sm font-bold leading-7 text-muted-foreground">
          Nonprofits can publicly support nonpartisan humanitarian treaty
          advocacy. The notes below answer the common nonprofit question without
          sending you away from the form.
        </p>
        <div className="mt-5 space-y-5 text-sm font-bold leading-7 text-foreground">
          {sections.map((section) => (
            <section
              className="border-t border-foreground pt-4 first:border-t-0 first:pt-0"
              key={section.heading}
            >
              <h3 className="text-sm font-black uppercase tracking-[0.12em]">
                {section.heading}
              </h3>
              {section.paragraphs.map((paragraph) => (
                <p className="mt-2 text-muted-foreground" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {section.links.map((link) =>
                    link.href.startsWith("http") ? (
                      <a
                        className="inline-block border border-foreground bg-background px-3 py-2 text-xs font-black uppercase text-foreground underline-offset-4 hover:underline"
                        href={link.href}
                        key={link.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        className="inline-block border border-foreground bg-background px-3 py-2 text-xs font-black uppercase text-foreground underline-offset-4 hover:underline"
                        href={link.href}
                        key={link.href}
                      >
                        {link.label}
                      </Link>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  return getSiteMetadata(site, content.metadata.endorse, ROUTES.endorse);
}

export default async function EndorsePage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  const user = await getCurrentUser();
  const referendumContent = await getReferendumPageContent(
    TREATY_REFERENDUM_SLUG,
  );
  const treatyMarkdown =
    referendumContent?.bodyMarkdown ??
    shareableSnippets.onePercentTreatyText.markdown;

  if (!site.primaryReferendumSlug) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Join as Organization</h1>
        <p className="mt-4 font-bold text-muted-foreground">
          No referendum is configured for this site.
        </p>
      </section>
    );
  }

  const manageableOrgs = user
    ? await getManageableOrganizationsForUser(user.id)
    : [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          {content.endorse.eyebrow}
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
          Enter your audience. See the suffering you cause or prevent.
        </h1>
        <p className="mt-5 text-base font-bold leading-7 text-muted-foreground">
          <ParameterValue
            param={GLOBAL_DISEASE_DEATHS_DAILY}
            valueOverride="150,000"
          />{" "}
          humans die from disease today. Most preventable. Your audience size
          decides how much of it gets to keep happening.
        </p>
      </header>

      <OrganizationImpactCalculator />

      <section className="mt-10 border-2 border-foreground bg-background p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Step 2 — One hour, three actions
        </p>
        <ol className="mt-4 space-y-4">
          {HOUR_ACTIONS.map((action, index) => (
            <li
              key={action.title}
              className="border-t border-foreground pt-4 first:border-t-0 first:pt-0"
            >
              <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
                {index + 1}. {action.title}
              </p>
              <p className="mt-1 text-sm font-bold leading-6 text-muted-foreground">
                {action.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div
        className="mt-10 scroll-mt-24"
        id="organization-endorsement-form"
      >
        <EndorseForm
          referendumSlug={site.primaryReferendumSlug}
          manageableOrgs={manageableOrgs.map((o) => ({
            id: o.id,
            name: o.name,
            status: o.status,
          }))}
        />
      </div>

      <LegalNotesDisclosure sections={content.legal.sections} />
      <TreatyTextDisclosure treatyMarkdown={treatyMarkdown} />

      <p className="mt-8 text-center text-xs font-bold text-muted-foreground">
        Already joined? See the{" "}
        <Link href={ROUTES.signatories} className="underline">
          {content.endorse.existingSupportersLabel}
        </Link>
        {"."}
      </p>
    </section>
  );
}
