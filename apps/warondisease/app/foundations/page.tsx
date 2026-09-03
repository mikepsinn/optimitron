import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BED_NETS_COST_PER_DALY,
  DEFENSE_LOBBYING_ANNUAL,
  DFDA_DIRECT_FUNDING_COST_PER_DALY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL,
  TREATY_ANNUAL_FUNDING,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_COST_PER_DALY,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_VS_BED_NETS_MULTIPLIER,
} from "@optimitron/data/parameters";
import Layout from "@/components/layout";
import { CopyGrantEmailButton } from "@/components/foundations/CopyGrantEmailButton";
import { LoveLetterCalculator } from "@/components/foundations/LoveLetterCalculator";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { FOUNDATION_CONTRACTOR_TARGETS } from "@/lib/foundations/contractor-targets";
import { NONPROFIT } from "@/lib/nonprofit-identity";
import { ROUTES } from "@/lib/routes";
import { SHOW_DONATE_LINKS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Foundations",
  description:
    "Buy shares for organizations, send board letters to military contractors, and check the expected DALYs and lives saved if the 1% Treaty campaign works.",
};

const grantEmailSubject = "Foundation grant for the 1% Treaty campaign";
const grantEmailHref =
  `mailto:${NONPROFIT.publicContactEmail}?subject=${encodeURIComponent(grantEmailSubject)}`;

const treatyMathHref =
  "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html";

const moneyRows = [
  [
    "Find an organization",
    "A nonprofit, patient group, peace group, church, student group, union, club, or other organization that wants less war and more medicine.",
  ],
  [
    "Buy and donate one share",
    "The organization becomes a shareholder. That is the boring little key that opens the boardroom door.",
  ],
  [
    "Send the board a love letter",
    "The letter asks the board to analyze whether shareholders are better off if the company shifts 1% of assets into biotech and lobbies for the 1% Treaty.",
  ],
  [
    "Follow up until it is real",
    "Lawyers check the template, organizers keep calling, and every output stays countable: organizations, shares, letters, replies, and public math checks.",
  ],
] as const;

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold uppercase leading-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase leading-5 text-muted-foreground">
      {children}
    </p>
  );
}

function ButtonLink({
  children,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "border border-foreground bg-foreground px-4 py-3 text-sm font-bold uppercase text-background hover:bg-background hover:text-foreground"
      : "border border-foreground bg-background px-4 py-3 text-sm font-bold uppercase text-foreground hover:bg-foreground hover:text-background";

  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function Stat({
  label,
  children,
  note,
}: {
  label: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className="border border-foreground p-4">
      <p className="text-xs font-bold uppercase leading-5 text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold leading-tight">{children}</p>
      {note ? <p className="mt-2 text-xs font-bold leading-5">{note}</p> : null}
    </div>
  );
}

export default function FoundationsPage() {
  return (
    <Layout>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <section className="space-y-6 border-b border-foreground pb-10">
            <Eyebrow>Foundation grants for the 1% Treaty</Eyebrow>
            <h1 className="max-w-4xl text-4xl font-bold uppercase leading-none sm:text-6xl">
              Give an organization one share and a letter.
            </h1>
            <div className="max-w-4xl space-y-5 text-lg font-bold leading-8 sm:text-xl sm:leading-9">
              <p>
                For about $300-$400, we can buy one share of a military contractor
                and donate it to a nonprofit, patient group, peace group, church,
                student group, or other organization that wants less war and more
                medicine.
              </p>
              <p>
                That makes them a shareholder. Then we help them send a polite
                love letter to the board.
              </p>
              <p>
                The letter does not ask the company to become kind. It asks the
                board to do the thing boards are supposed to do: look after
                shareholders.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {SHOW_DONATE_LINKS ? (
                <ButtonLink href={ROUTES.donate}>Fund one share</ButtonLink>
              ) : null}
              <ButtonLink
                href={grantEmailHref}
                variant={SHOW_DONATE_LINKS ? "secondary" : "primary"}
              >
                Open email draft
              </ButtonLink>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Receiving charity">{NONPROFIT.legalName}</Stat>
            <Stat label="Tax ID">EIN {NONPROFIT.ein}</Stat>
            <Stat label="Legal status">Wyoming 501(c)(3)</Stat>
            <Stat label="First milestone">1,000 organizations</Stat>
          </section>

          <section className="space-y-5 border-t border-foreground pt-8">
            <SectionHeading>The mechanism</SectionHeading>
            <div className="max-w-4xl space-y-4 text-base font-bold leading-7 sm:text-lg sm:leading-8">
              <p>
                The argument is simple: sell 1% of the company&apos;s assets and
                invest it in biotechnology. If biotech has better margins than
                making more weapons, that is good for shareholders.
              </p>
              <p>
                Then use the company&apos;s lobbying power to ask the same
                question at national scale: would shareholders be better off if 1%
                of military spending moved into pragmatic clinical trials?
              </p>
              <p>
                If the answer is yes, lobby for the 1% Treaty instead of lobbying
                for infinitely more weapons forever. That would lower clinical
                trial costs for the biotech companies the contractor just bought.
                It would also make shareholders significantly less dead.
              </p>
            </div>
          </section>

          <section className="space-y-6 border-t border-foreground pt-8">
            <div className="max-w-4xl space-y-3">
              <SectionHeading>Run the math</SectionHeading>
              <p className="text-base font-bold leading-7 sm:text-lg">
                Pick how many organizations to equip and which contractors to
                write. The model uses the cited treaty impact parameters and
                assumes the campaign starts to matter when at least 1,000
                organizations are doing this.
              </p>
            </div>
            <LoveLetterCalculator
              targets={FOUNDATION_CONTRACTOR_TARGETS}
              totalDalys={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value}
              totalLivesSaved={
                DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value
              }
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Stat label="DALYs at stake">
                <ParameterValue
                  className="font-bold"
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS}
                  display="auto"
                />
              </Stat>
              <Stat label="Lives at stake">
                <ParameterValue
                  className="font-bold"
                  param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                  display="auto"
                />
              </Stat>
              <Stat label="Treaty funding">
                <ParameterValue
                  className="font-bold"
                  param={TREATY_ANNUAL_FUNDING}
                  display="auto"
                />
              </Stat>
              <Stat label="Military lobbying">
                <ParameterValue
                  className="font-bold"
                  param={DEFENSE_LOBBYING_ANNUAL}
                  display="auto"
                />
              </Stat>
            </div>
          </section>

          <section className="space-y-6 border-t border-foreground pt-8">
            <div className="max-w-4xl space-y-3">
              <SectionHeading>What money does</SectionHeading>
              <p className="text-base font-bold leading-7 sm:text-lg">
                We will take whatever a foundation wants to give us. The unit of
                work is not mysterious. More money buys more of this loop.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {moneyRows.map(([label, body]) => (
                <div className="border border-foreground p-4" key={label}>
                  <h3 className="text-lg font-bold uppercase leading-tight">
                    {label}
                  </h3>
                  <p className="mt-3 text-sm font-bold leading-6">{body}</p>
                </div>
              ))}
            </div>
            <p className="max-w-4xl text-base font-bold leading-7 text-muted-foreground">
              A small grant can buy a few shares and letters. A larger grant lets
              someone spend the next two years doing the boring part: finding
              organizations, buying shares, getting lawyers to check the letters,
              sending them, following up, and making sure this does not become
              another clever PDF nobody used.
            </p>
          </section>

          <section className="space-y-6 border-t border-foreground pt-8">
            <SectionHeading>
              Cost-effectiveness, with the skeptic&apos;s discounts already
              applied
            </SectionHeading>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Conditional on success">
                <ParameterValue
                  className="font-bold"
                  param={TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG}
                  display="withUnit"
                />
                <span className="block text-sm font-bold leading-6">
                  per DALY, roughly{" "}
                  <ParameterValue
                    className="font-bold"
                    param={TREATY_VS_BED_NETS_MULTIPLIER}
                    valueOverride={`${new Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 0,
                    }).format(
                      Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value / 100) * 100,
                    )}x`}
                  />{" "}
                  better than bed nets.
                </span>
              </Stat>
              <Stat label="Risk-adjusted">
                <ParameterValue
                  className="font-bold"
                  param={TREATY_EXPECTED_COST_PER_DALY}
                  display="withUnit"
                />
                <span className="block text-sm font-bold leading-6">
                  per DALY, still{" "}
                  <ParameterValue
                    className="font-bold"
                    param={TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER}
                    valueOverride={`${new Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 0,
                    }).format(TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER.value)}x`}
                  />{" "}
                  better than bed nets.
                </span>
              </Stat>
              <Stat label="If the treaty never passes">
                <ParameterValue
                  className="font-bold"
                  param={DFDA_DIRECT_FUNDING_COST_PER_DALY}
                  display="withUnit"
                />
                <span className="block text-sm font-bold leading-6">
                  per DALY for direct philanthropic funding of pragmatic trials
                  alone.
                </span>
              </Stat>
            </div>
            <div className="space-y-4 border border-foreground p-5 text-base font-bold leading-7">
              <p>
                The calculator above prices the full treaty success case: the
                disease timeline shift in the cited model, discounted by
                organizations reached, contractor coverage, and whatever pivotal
                probability you assign.
              </p>
              <p>
                If you only want to credit a single treaty year, use this as a
                separate sanity check. One treaty year puts{" "}
                <ParameterValue
                  className="font-bold"
                  param={DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL}
                  display="auto"
                />{" "}
                into trials at{" "}
                <ParameterValue
                  className="font-bold"
                  param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
                  display="auto"
                />
                /patient, roughly 23 million patient-slots. The useful foundation
                question is not &quot;what is the perfect grant size?&quot; It is
                whether the chance of helping trigger the treaty beats the bed-net
                baseline. The calculator above lets you change the spend and the
                pivotal probability directly.
              </p>
              <p>
                The break-even against bed nets at{" "}
                <ParameterValue
                  className="font-bold"
                  param={BED_NETS_COST_PER_DALY}
                  display="withUnit"
                />{" "}
                sits near a one-in-five-thousand chance of mattering. We are not
                claiming the campaign probably succeeds. The claim is narrower:
                that its probability of being pivotal exceeds one in five
                thousand.
              </p>
            </div>
          </section>

          {SHOW_DONATE_LINKS ? (
            <section className="space-y-6 border-t border-foreground pt-8">
              <SectionHeading>Donate to the campaign</SectionHeading>
              <div className="max-w-4xl space-y-4 text-base font-bold leading-7 sm:text-lg">
                <p>
                  The receiving charity is {NONPROFIT.legalName}, EIN{" "}
                  {NONPROFIT.ein}, operating the International Campaign to End
                  War and Disease. Donations buy outreach, shares, board letters,
                  lawyer review, and follow-up.
                </p>
                <ButtonLink href={ROUTES.donate}>Donate</ButtonLink>
              </div>
            </section>
          ) : null}

          <section className="space-y-6 border-t border-foreground pt-8">
            <SectionHeading>Please check the math</SectionHeading>
            <div className="max-w-4xl space-y-4 text-base font-bold leading-7 sm:text-lg">
              <p>
                Our model says this is the best use of our time for reducing
                suffering on Earth that we have found. We know how that sounds.
                The numbers are public because we would rather be corrected before
                anyone funds us.
              </p>
              <p>
                Please check the math. If there is a better use of our time, or a
                cheaper way to avert a DALY, email us. We will do the better thing
                instead.
              </p>
              <p>
                If the math is right but someone else should run this, use it. We
                do not need credit. We need the thing to happen.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={treatyMathHref} variant="secondary">
                Check the treaty math
              </ButtonLink>
              <ButtonLink href={grantEmailHref}>
                Open email draft
              </ButtonLink>
            </div>
          </section>

          <section className="space-y-4 border-t border-foreground pt-8">
            <SectionHeading>Email us about a grant</SectionHeading>
            <div className="flex max-w-4xl flex-wrap items-center gap-3 text-base font-bold leading-7 sm:text-lg">
              <a
                className="break-all underline decoration-foreground underline-offset-4"
                href={grantEmailHref}
              >
                {NONPROFIT.publicContactEmail}
              </a>
              <CopyGrantEmailButton email={NONPROFIT.publicContactEmail} />
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
