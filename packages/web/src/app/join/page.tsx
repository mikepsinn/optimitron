import { headers } from "next/headers";
import Link from "next/link";
import {
  BED_NETS_COST_PER_DALY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  CURRENT_KNOWN_SAFE_EXPLORATION_YEARS,
  DFDA_KNOWN_SAFE_EXPLORATION_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  DRUG_DISEASE_COMBINATIONS_POSSIBLE,
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_SPARE_APOCALYPSES,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_VS_BED_NETS_MULTIPLIER,
  shareableSnippets,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TreatyContent } from "@/components/treaty/TreatyContent";
import { defaultButtonClassName } from "@/components/ui/default-button";
import type { ReferendumSiteLegalSection } from "@/content/referendum-sites/types";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSiteMetadata } from "@/lib/metadata";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { NONPROFIT_COALITION_STRATEGY_URL, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { EndorseForm } from "./EndorseForm";

export const dynamic = "force-dynamic";

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
        Read the treaty
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
            className={defaultButtonClassName}
          >
            Back to organization form
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
  return getSiteMetadata(site, content.metadata.endorse, ROUTES.join);
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
        <h1 className="text-3xl font-black uppercase">
          Join as an Organization
        </h1>
        <p className="mt-4 font-bold text-muted-foreground">
          No referendum is open here yet. Check back soon.
        </p>
      </section>
    );
  }

  const manageableOrgs = user
    ? await getManageableOrganizationsForUser(user.id)
    : [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
          Join the International Campaign to End War and Disease
        </h1>
      </header>

      <p className="mt-6 border-t border-foreground pt-4 text-sm font-bold text-foreground">
        Don&apos;t have an organization?{" "}
        <Link href={ROUTES.vote} className="underline underline-offset-4">
          Vote here →
        </Link>
      </p>

      <div
        className="scroll-mt-24 [&>form]:border-0"
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

      <div className="mt-8 space-y-6 text-base font-bold leading-7 text-muted-foreground">
        <div className="border-2 border-foreground p-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            The deal
          </h2>
          <p className="mt-3">
            It takes about 100 nuclear weapons to cause a nuclear winter and
            end civilization. We have 12,200 of them. That is enough for{" "}
            <ParameterValue
              figures={3}
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses. We only have one civilization to apocalypse, so you
            cannot even take advantage of the remaining{" "}
            <ParameterValue
              figures={3}
              param={NUCLEAR_WINTER_SPARE_APOCALYPSES}
            />.
          </p>
          <p className="mt-3">
            We are trying to get a global survey of at least 4 billion people
            where a majority of humans say: yes, we can have one fewer
            apocalypse of mass-murder capacity in exchange for eradicating
            disease{" "}
            <ParameterValue
              figures={3}
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            />
            x faster. Your organization helps us ask.
          </p>
        </div>

        <div className="border-2 border-foreground p-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            The treatment queue
          </h2>
          <p className="mt-3">
            There are{" "}
            <ParameterValue
              figures={3}
              param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT}
            />{" "}
            diseases without effective treatment. At the current rate of{" "}
            <ParameterValue
              figures={2}
              param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR}
            />{" "}
            new first treatments per year, clearing the queue takes{" "}
            <ParameterValue
              figures={3}
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
            />{" "}
            years. Redirecting 1% of military spending to clinical trials
            multiplies trial capacity by{" "}
            <ParameterValue
              figures={3}
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            />
            x and clears the queue in{" "}
            <ParameterValue
              figures={2}
              param={DFDA_QUEUE_CLEARANCE_YEARS}
            />{" "}
            years.
          </p>
          <p className="mt-3">
            Meanwhile, there are{" "}
            <ParameterValue figures={3} param={SAFE_COMPOUNDS_COUNT} /> compounds
            already proven safe in humans — FDA-approved drugs, GRAS substances —
            that have never been tested against most diseases. That is{" "}
            <ParameterValue
              figures={3}
              param={DRUG_DISEASE_COMBINATIONS_POSSIBLE}
            />{" "}
            possible drug-disease combinations sitting untested. At current trial
            capacity, testing them all takes{" "}
            <ParameterValue
              figures={3}
              param={CURRENT_KNOWN_SAFE_EXPLORATION_YEARS}
            />{" "}
            years. At treaty-scale capacity, it takes{" "}
            <ParameterValue
              figures={3}
              param={DFDA_KNOWN_SAFE_EXPLORATION_YEARS}
            />
            .
          </p>
          <p className="mt-3">
            Every day that shift happens sooner prevents{" "}
            <ParameterValue figures={3} param={GLOBAL_DISEASE_DEATHS_DAILY} />{" "}
            deaths.
          </p>
        </div>

        <div className="border-2 border-foreground p-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            Cost-effectiveness
          </h2>
          <p className="mt-3">
            The best-proven intervention in global health is insecticide-treated
            bed nets at{" "}
            <ParameterValue figures={2} param={BED_NETS_COST_PER_DALY} /> per
            DALY averted. The 1% Treaty&apos;s cost per DALY averted is{" "}
            <ParameterValue
              figures={2}
              param={TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG}
            />
            , making it{" "}
            <ParameterValue
              figures={3}
              param={TREATY_VS_BED_NETS_MULTIPLIER}
            />
            x more cost-effective than the GiveWell baseline. If your
            organization allocates resources to health, these are the numbers to
            beat.
          </p>
        </div>

        <div className="border-2 border-foreground p-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            Precedent
          </h2>
          <p className="mt-3">
            The{" "}
            <Link
              href="https://en.wikipedia.org/wiki/International_Campaign_to_Ban_Landmines"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              landmine ban
            </Link>{" "}
            started with 6 NGOs, grew to 1,400 organizations, and produced a
            treaty signed by 122 countries. The organizers won the Nobel Peace
            Prize.{" "}
            <Link
              href="https://en.wikipedia.org/wiki/International_Campaign_to_Abolish_Nuclear_Weapons"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              ICAN
            </Link>{" "}
            started with a staff of 5, recruited 600+ partner organizations, and
            also won the Nobel Peace Prize. Both campaigns asked organizations to
            do exactly what this form asks: endorse a treaty, then tell your
            members.
          </p>
        </div>

        <div className="border-2 border-foreground p-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            What your organization does
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5">
            <li>
              <span className="font-black text-foreground">Endorse</span> the
              1% Treaty using the form above.
            </li>
            <li>
              <span className="font-black text-foreground">
                Email your members the{" "}
                <Link
                  href={ROUTES.vote}
                  className="underline underline-offset-4"
                >
                  Global Survey link
                </Link>
              </span>{" "}
              so they can vote. Each voter recruits two more. That is the
              entire growth model.
            </li>
            <li>
              Ask members to{" "}
              <Link
                href={ROUTES.joke}
                className="font-black underline underline-offset-4 text-foreground"
              >
                play the funniest joke in the universe
              </Link>{" "}
              on their friends on Earth Optimization Day — write the facts on
              every shirt in a loved one&apos;s closet.
            </li>
            <li>
              Ask members to{" "}
              <Link
                href={ROUTES.employees}
                className="font-black underline underline-offset-4 text-foreground"
              >
                remind their presidents
              </Link>{" "}
              to do their overdue task of signing the 1% Treaty.
            </li>
            <li>
              <Link
                href={ROUTES.plaintiffs}
                className="font-black underline underline-offset-4 text-foreground"
              >
                Register deceased loved ones as plaintiffs
              </Link>{" "}
              in Humanity v. Government — the class action should count the
              victims, not wave at a fog bank.
            </li>
            <li>
              Buy $200 of stock in a military contractor and{" "}
              <a
                href="https://manual.warondisease.org/knowledge/appendix/love-letter.html"
                className="font-black underline underline-offset-4 text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                send the board a love letter
              </a>{" "}
              — a shareholder demand letter that legally requires them to read
              why reallocating 1% to clinical trials maximizes long-term
              shareholder value.
            </li>
            <li>
              <Link
                href={ROUTES.shirt}
                className="font-black underline underline-offset-4 text-foreground"
              >
                Get the shirt.
              </Link>{" "}
              Wear the math.
            </li>
          </ol>
        </div>

        <p>
          Governments currently spend{" "}
          <ParameterValue
            figures={3}
            param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
          />
          x more on the military than on clinical trials. The 1% Treaty
          corrects that ratio. Your endorsement is how it passes.{" "}
          <Link
            href={NONPROFIT_COALITION_STRATEGY_URL}
            className="underline underline-offset-4"
          >
            Full coalition strategy →
          </Link>
        </p>
      </div>

      <LegalNotesDisclosure sections={content.legal.sections} />
      <TreatyTextDisclosure treatyMarkdown={treatyMarkdown} />

      <p className="mt-4 text-center text-xs font-bold text-muted-foreground">
        Already joined? See the{" "}
        <Link href={ROUTES.signatories} className="underline">
          {content.endorse.existingSupportersLabel}
        </Link>
        {"."}
      </p>
    </section>
  );
}
