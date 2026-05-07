import { headers } from "next/headers";
import Link from "next/link";
import type React from "react";
import {
  CURRENT_DISEASE_PATIENTS_GLOBAL,
  GLOBAL_DISEASE_DEATHS_DAILY,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  shareableSnippets,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TreatyTradeThesis } from "@/components/referendum/TreatyTradeThesis";
import { TreatyContent } from "@/components/treaty/TreatyContent";
import type { ReferendumSiteLegalSection } from "@/content/referendum-sites/types";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSiteMetadata } from "@/lib/metadata";
import {
  getManageableOrganizationsForUser,
  NONPROFIT_COALITION_STRATEGY_URL,
} from "@/lib/organization.server";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getSiteFromHeaders } from "@/lib/site";
import { ROUTES } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import {
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
} from "@/lib/treaty-share-flow-parameters";
import { EndorseForm } from "./EndorseForm";
import { OrganizationImpactCalculator } from "./OrganizationImpactCalculator";

export const dynamic = "force-dynamic";

const ORGANIZATION_BENEFITS = [
  {
    title: "A number worth reporting",
    body: (
      <>
        Each verified vote has a modeled impact:{" "}
        <ParameterValue figures={2} param={FLOW_VOTER_LIVES_SAVED_ROUNDED} />{" "}
        lives saved and{" "}
        <ParameterValue
          figures={2}
          param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED}
        />{" "}
        years of suffering prevented if the treaty succeeds.
      </>
    ),
  },
  {
    title: "One hour, then it keeps working",
    body: "Paste the widget, send one message, and keep collecting verified treaty votes while your website keeps doing its quiet little job.",
  },
  {
    title: "Your members can multiply it",
    body: "If members share after signing, your one email stops being one email and starts acting like a chain reaction.",
  },
  {
    title: "Make outreach fundable",
    body: "Use the foundation template to seek outreach grants tied to verified votes. If your organization can get votes cheaply, ending war and disease becomes fundable work.",
  },
  {
    title: "No campaign to invent",
    body: "Use your organization's survey link, website button, iframe, and starter copy. No blank-page strategy session required.",
  },
] as const;

function ImpactStat({
  label,
  children,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="border-t border-foreground pt-4 first:border-t-0 first:pt-0 sm:border-l sm:border-t-0 sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <div className="text-3xl font-black uppercase leading-none text-foreground sm:text-4xl">
        {children}
      </div>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

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
    <section className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {content.endorse.eyebrow}
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
          End War And Disease One Day Sooner
        </h1>
        <div className="mx-auto mt-5 max-w-3xl space-y-4 text-left text-base font-bold leading-7 text-muted-foreground sm:text-center">
          <p>
            Allowing billions of humans to suffer and die from disease so
            governments can preserve{" "}
            <ParameterValue
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
              valueOverride="122"
            />
            -apocalypse mass-murder capacity is barbaric mass cruelty. Like
            slavery, it will persist until enough humans and institutions
            publicly state that it is morally wrong and incredibly stupid. Your
            organization can be one of those institutions.
          </p>
          <p>
            None of us can end war and disease on our own. Ending it requires a
            majority of humanity agreeing to allocate resources in proportion to
            the degree to which each purpose promotes the general welfare. The{" "}
            <Link href={ROUTES.treaty} className="underline underline-offset-4">
              1% Treaty
            </Link>{" "}
            is intended to establish that agreement. Your organization and its
            members are part of the majority that must agree. Moving that
            agreement forward by one day prevents about{" "}
            <ParameterValue
              param={GLOBAL_DISEASE_DEATHS_DAILY}
              valueOverride="150,000"
            />{" "}
            deaths from disease and roughly{" "}
            <ParameterValue
              param={CURRENT_DISEASE_PATIENTS_GLOBAL}
              valueOverride="2 billion"
            />{" "}
            days of suffering.
          </p>
        </div>
      </header>

      <section className="mb-8 border-2 border-foreground bg-background p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Why bother?
        </p>
        <h2 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-tight text-foreground">
          One verified vote is modeled as:
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ImpactStat label="lives saved per vote">
            <ParameterValue
              figures={2}
              param={FLOW_VOTER_LIVES_SAVED_ROUNDED}
            />
          </ImpactStat>
          <ImpactStat label="years of suffering prevented per vote">
            <ParameterValue
              figures={2}
              param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED}
            />
          </ImpactStat>
        </div>
        <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-muted-foreground">
          The model divides the treaty&apos;s projected lives saved and
          suffering prevented across the majority of humanity needed to make
          governments unable to ignore it.
        </p>
        <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-muted-foreground">
          The calculator below multiplies these per-vote numbers by your
          estimated verified votes. That is why the totals get large. Numbers do
          that when humans cooperate. Very suspicious behavior.
        </p>
        <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-muted-foreground">
          Your organization does not need to donate or endorse a candidate. Join
          the {site.organizationName}, support the{" "}
          <Link href={ROUTES.treaty} className="underline underline-offset-4">
            1% Treaty
          </Link>
          , and put the vote where your members already are. The treaty
          position: <TreatyTradeThesis />.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <aside className="order-2 border-2 border-foreground bg-background p-6 lg:order-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Why this is worth your hour
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-foreground [font-family:var(--v0-font-libre-baskerville)]">
            Spend one hour where it can save the most humans.
          </h2>
          <p className="mt-4 font-bold leading-7 text-muted-foreground">
            Put the treaty where your members already are. Every verified vote
            moves the agreement closer to reality: less mass-murder capacity,
            more disease eradication.
          </p>
          <ul className="mt-6 space-y-4">
            {ORGANIZATION_BENEFITS.map((benefit) => (
              <li
                key={benefit.title}
                className="border-t border-foreground pt-4"
              >
                <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
                  {benefit.title}
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-muted-foreground">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href={NONPROFIT_COALITION_STRATEGY_URL}
            className="mt-6 inline-block text-sm font-black uppercase underline underline-offset-4"
          >
            Why organizations should join
          </Link>
        </aside>

        <div
          className="order-1 scroll-mt-24 lg:order-2"
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
          <OrganizationImpactCalculator />
        </div>
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
