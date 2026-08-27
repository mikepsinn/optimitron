import type { Metadata } from "next";
import Link from "next/link";
import {
  BED_NETS_COST_PER_DALY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  CURRENT_KNOWN_SAFE_EXPLORATION_YEARS,
  DFDA_KNOWN_SAFE_EXPLORATION_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  DRUG_DISEASE_COMBINATIONS_POSSIBLE,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_SPARE_APOCALYPSES,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_VS_BED_NETS_MULTIPLIER,
  shareableSnippets,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import Layout from "@/components/layout";
import { TreatyContent } from "@/components/treaty/TreatyContent";
import { defaultButtonClassName } from "@optimitron/site-kit/components/ui/default-button";
import type { ReferendumSiteLegalSection } from "@optimitron/site-kit/content/referendum-sites/types";
import { getCurrentUser } from "@/lib/auth-utils";
import { getManageableOrganizationsForUser } from "@/lib/organization-membership.server";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { getReferendumSiteContent } from "@optimitron/site-kit/content/referendum-sites";
import { COURT_LINKS } from "@/lib/court-links";
import { NONPROFIT_COALITION_STRATEGY_URL, ROUTES } from "@/lib/routes";
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

export const metadata: Metadata = {
  title: "Join as an Organization",
  description:
    "Your members probably dislike war, disease, and preventable funerals. Join the campaign and conduct the Global Survey with your audience.",
};

export default async function EndorsePage() {
  const content = getReferendumSiteContent("onePercentTreaty");
  const user = await getCurrentUser();
  const referendumContent = await getReferendumPageContent(
    TREATY_REFERENDUM_SLUG,
  );
  const treatyMarkdown =
    referendumContent?.bodyMarkdown ??
    shareableSnippets.onePercentTreatyText.markdown;


  const manageableOrgs = user
    ? await getManageableOrganizationsForUser(user.id, {
        publiclyReferenceableOnly: true,
      })
    : [];

  return (
    <Layout>
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
            referendumSlug={TREATY_REFERENDUM_SLUG}
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
              It takes about{" "}
              <ParameterValue
                figures={3}
                param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
              />{" "}
              nuclear weapons to cause a nuclear winter and end civilization. We
              have <ParameterValue figures={5} param={GLOBAL_WARHEAD_COUNT} /> of
              them. That is enough for{" "}
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
                display="withUnit"
                figures={3}
                param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
              />{" "}
              faster. Your organization helps us ask.
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
                display="withUnit"
                figures={3}
                param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
              />{" "}
              and clears the queue in{" "}
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
              <span>
                <ParameterValue
                  display="withUnit"
                  figures={3}
                  param={DFDA_KNOWN_SAFE_EXPLORATION_YEARS}
                />
                .
              </span>
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
              The best thing anyone has found to do with money in global health is
              buy insecticide-treated bed nets.{" "}
              <ParameterValue figures={2} param={BED_NETS_COST_PER_DALY} /> per
              disability-adjusted life-year averted. That is the GiveWell
              gold standard. The 1% Treaty costs{" "}
              <ParameterValue
                figures={2}
                param={TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG}
              />{" "}
              per DALY averted —{" "}
              <ParameterValue
                display="withUnit"
                figures={3}
                param={TREATY_VS_BED_NETS_MULTIPLIER}
              />{" "}
              more cost-effective than bed nets. Find something better and do that
              instead.
            </p>
          </div>

          <div className="border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
              This has worked before
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
              </Link>
              : 6 NGOs → 1,400 organizations → treaty signed by 122
              countries → Nobel Peace Prize.{" "}
              <Link
                href="https://en.wikipedia.org/wiki/International_Campaign_to_Abolish_Nuclear_Weapons"
                className="underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                ICAN
              </Link>
              : 5 staff in a Geneva office → 600+ partner organizations →
              Nobel Peace Prize. Both campaigns did exactly what this form asks:
              endorse a treaty, tell your members. That is it. That is the
              whole trick.
            </p>
          </div>

          <div className="border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
              What your organization does
            </h2>
            <p className="mt-3">
              Endorse the treaty using the form above, then tell everyone in
              your organization to do the following:
            </p>
            <ol className="mt-3 list-decimal space-y-3 pl-5">
              <li>
                <Link
                  href={ROUTES.vote}
                  className="font-black underline underline-offset-4 text-foreground"
                >
                  Vote on the Global Survey.
                </Link>{" "}
                30 seconds. Then get two more humans to do it. That is the
                entire growth model.
              </li>
              <li>
                <Link
                  href={ROUTES.joke}
                  className="font-black underline underline-offset-4 text-foreground"
                >
                  Play the funniest joke in the universe
                </Link>{" "}
                on everyone you love on Earth Optimization Day. Write{" "}
                <span className="font-black text-foreground">
                  &ldquo;THIS T-SHIRT ENDED WAR AND DISEASE&rdquo;
                </span>{" "}
                on every shirt in a loved one&apos;s closet. On the back:{" "}
                <span className="font-black text-foreground">
                  &ldquo;Trade one apocalypse for disease eradication at
                  warondisease.org.&rdquo;
                </span>{" "}
                Tuck in a card with the math and a QR code. They will be
                furious. They will also not be dead of a curable disease. You
                are welcome.
              </li>
              <li>
                <Link
                  href={ROUTES.employees}
                  className="font-black underline underline-offset-4 text-foreground"
                >
                  Remind your presidents
                </Link>{" "}
                that you pay them{" "}
                <ParameterValue
                  figures={3}
                  param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
                />{" "}
                a year to promote the general welfare and you would like to
                receive this service at some point. Signing the 1% Treaty is a
                30-second task. Every day they do not complete it,{" "}
                <ParameterValue
                  figures={3}
                  param={GLOBAL_DISEASE_DEATHS_DAILY}
                />{" "}
                people die of diseases that would have been cured faster if they
                had done their job.
              </li>
              <li>
                <Link
                  href={COURT_LINKS.plaintiffs.url}
                  className="font-black underline underline-offset-4 text-foreground"
                >
                  Register your dead.
                </Link>{" "}
                Your government spent your money on missiles instead of testing
                which medicines work. People you loved died of diseases that
                would have been cured if that money had gone to clinical trials.
                That is negligent homicide at civilizational scale. Humanity v.
                Government is the class action. The dead should be named.
              </li>
              <li>
                Buy one share of a military contractor — $200 — and{" "}
                <a
                  href="https://manual.warondisease.org/knowledge/appendix/love-letter.html"
                  className="font-black underline underline-offset-4 text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  send the board a love letter
                </a>
                <span>. </span>
                The law calls it a shareholder demand letter. The board is legally
                required to read it and respond on the record. It tells them to
                sell 1% of their bomb-making infrastructure, invest the proceeds
                in biotech, and instruct their lobbyists to stop asking Congress
                for infinity nuclear weapons and instead reallocate one apocalypse
                worth of spending to pragmatic clinical trials. This would make
                them and their shareholders both richer and significantly less
                dead. They just have to read the math.
              </li>
              <li>
                <Link
                  href={ROUTES.shirt}
                  className="font-black underline underline-offset-4 text-foreground"
                >
                  Get the shirt.
                </Link>{" "}
                Front says{" "}
                <span className="font-black text-foreground">
                  THIS T-SHIRT ENDED WAR AND DISEASE
                </span>
                <span>. </span>
                Back says{" "}
                <span className="font-black text-foreground">
                  Trade one apocalypse for disease eradication
                </span>
                <span>. </span>
                People will read it because it is on your chest and they cannot
                help themselves.
              </li>
            </ol>
          </div>

          <p>
            Governments spend{" "}
            <ParameterValue
              display="withUnit"
              figures={3}
              param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
            />{" "}
            more on the military than on clinical trials. The 1% Treaty
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
    </Layout>
  );
}
