import Link from "next/link";
import type { ReactNode } from "react";
import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  BED_NETS_COST_PER_DALY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  POST_WW2_MILITARY_CUT_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  TREATY_VS_BED_NETS_MULTIPLIER,
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
} from "@optimitron/data/parameters";
import type { Parameter } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { TaskFundingPledgeForm } from "@/components/task-funding/TaskFundingPledgeForm";
import { TaskFundingProgress } from "@/components/task-funding/TaskFundingProgress";
import { getCurrentUser } from "@/lib/auth-utils";
import { getRouteMetadata } from "@/lib/metadata";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { foundationsLink, getSignInPath, prizeLink, ROUTES } from "@/lib/routes";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";

export const metadata = getRouteMetadata(foundationsLink);

const PLEDGE_SHIRT_TASK_ID = "pledge-shirt-assurance-contract";

const diseaseEradicationSpeedMultiplier =
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value / DFDA_QUEUE_CLEARANCE_YEARS.value;

const DISEASE_ERADICATION_SPEED_MULTIPLIER: Parameter = {
  value: diseaseEradicationSpeedMultiplier,
  unit: "x",
  parameterName: "DISEASE_ERADICATION_SPEED_MULTIPLIER",
  displayName: "Disease Eradication Speed Multiplier",
  description:
    "How many times faster the dFDA treatment queue clears than the status quo queue.",
  sourceType: "calculated",
  confidence: "high",
  formula: "STATUS_QUO_QUEUE_CLEARANCE_YEARS / DFDA_QUEUE_CLEARANCE_YEARS",
  manualPageUrl: STATUS_QUO_QUEUE_CLEARANCE_YEARS.manualPageUrl,
  manualPageTitle: STATUS_QUO_QUEUE_CLEARANCE_YEARS.manualPageTitle,
};

const oneLessApocalypse = Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value) - 1;

const treatyValueToShirtCostRatio =
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value /
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD.value;

const TREATY_VALUE_TO_SHIRT_COST_RATIO: Parameter = {
  value: treatyValueToShirtCostRatio,
  unit: "x",
  parameterName: "TREATY_VALUE_TO_SHIRT_COST_RATIO",
  displayName: "Treaty Value to Shirt Distribution Cost Ratio",
  description:
    "Projected value of the 1% Treaty divided by the universal shirt distribution cost.",
  sourceType: "calculated",
  confidence: "high",
  formula:
    "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE / UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD",
  manualPageUrl:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.manualPageUrl,
  manualPageTitle:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.manualPageTitle,
};

const giveWellDalysForUniversalShirtCost =
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD.value / BED_NETS_COST_PER_DALY.value;

const GIVEWELL_DALYS_FOR_UNIVERSAL_SHIRT_COST: Parameter = {
  value: giveWellDalysForUniversalShirtCost,
  unit: "DALYs",
  parameterName: "GIVEWELL_DALYS_FOR_UNIVERSAL_SHIRT_COST",
  displayName: "GiveWell Top-Charity DALYs for Universal Shirt Cost",
  description:
    "DALYs averted if the universal shirt distribution budget were spent at the GiveWell bed-net benchmark.",
  sourceType: "calculated",
  confidence: "high",
  formula: "UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD / BED_NETS_COST_PER_DALY",
  manualPageUrl: BED_NETS_COST_PER_DALY.manualPageUrl,
  manualPageTitle: BED_NETS_COST_PER_DALY.manualPageTitle,
};

const ratioFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function Paragraph({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-base font-bold leading-7 sm:text-lg sm:leading-8 ${className}`}
    >
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function Section({ children }: { children: ReactNode }) {
  return (
    <section className="mt-8 border-2 border-foreground bg-background p-5 sm:p-8">
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function SignInPrompt({ href, label }: { href: string; label: string }) {
  return (
    <div className="border-2 border-foreground bg-background p-5">
      <Link
        className="inline-flex border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
        href={href}
      >
        {label}
      </Link>
    </div>
  );
}

function StrongValue({
  children,
  param,
  valueOverride,
}: {
  children?: ReactNode;
  param?: Parameter;
  valueOverride?: string;
}) {
  if (param) {
    return (
      <ParameterValue
        className="font-black"
        param={param}
        valueOverride={valueOverride}
      />
    );
  }

  return <strong className="font-black">{children}</strong>;
}

export default async function FoundationsPage() {
  const [fundingStatus, user] = await Promise.all([
    getTaskFundingStatus(PLEDGE_SHIRT_TASK_ID),
    getCurrentUser(),
  ]);
  const manageableOrganizations = user
    ? await getManageableOrganizationsForUser(user.id)
    : [];
  const [pledgeOrganization = null] = manageableOrganizations;

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="border-2 border-foreground bg-background p-5 sm:p-8">
          <h1 className="text-3xl font-black uppercase leading-none sm:text-6xl">
            BUY THE T-SHIRT THAT ENDED WAR AND DISEASE.
          </h1>
          <p className="mt-6 text-lg font-bold leading-8 sm:text-xl sm:leading-9">
            If 1 billion humans wear this shirt on the same day — Earth
            Optimization Day, August 6 — humanity is forced to discuss the fact
            that it currently maintains sufficient mass-murder capacity to cause{" "}
            <ParameterValue
              className="font-black"
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses, and that it has the option to sacrifice one of these
            apocalypses for disease eradication within our lifetime.
          </p>
        </section>

        <Section>
          <Paragraph>
            If 8 billion people buy this t-shirt and wear it on the same day,
            they will have conversations with each other about it.
          </Paragraph>

          <Paragraph>In those conversations they will realize:</Paragraph>

          <ul className="space-y-4 pl-5 text-base font-bold leading-7 sm:text-lg sm:leading-8">
            <li className="list-disc">
              We currently spend{" "}
              <StrongValue
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              />{" "}
              times as much on our capacity for mass murder as we spend on
              curing the diseases that are going to kill them and everyone they
              love.
            </li>
            <li className="list-disc">
              Accepting a{" "}
              <StrongValue
                param={NUCLEAR_WINTER_OVERKILL_FACTOR}
                valueOverride={`${oneLessApocalypse}-apocalypse mass-murder capacity`}
              />{" "}
              (down from <StrongValue param={NUCLEAR_WINTER_OVERKILL_FACTOR} />)
              would let us eradicate disease{" "}
              <StrongValue
                param={DISEASE_ERADICATION_SPEED_MULTIPLIER}
                valueOverride={`${Math.round(
                  diseaseEradicationSpeedMultiplier,
                )}`}
              />{" "}
              times faster.
            </li>
            <li className="list-disc">
              Military spending was{" "}
              <StrongValue
                param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
              />{" "}
              lower immediately before the United States won World War II. The
              US then cut military spending{" "}
              <StrongValue param={POST_WW2_MILITARY_CUT_PCT} /> over 2 years
              after winning. So drastic reductions are not hypothetical — they
              have already been done, by the same country, in living memory.
            </li>
            <li className="list-disc">
              It is therefore possible to cut vastly more than 1%, and doing so
              would speed up the rate of medical progress unimaginably.
            </li>
            <li className="list-disc">
              They will realize this is wise because your annual chance of dying
              in a terrorist attack is about{" "}
              <StrongValue
                param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR}
                valueOverride="1 in 30 million"
              />
              , and the chance of suffering and dying from a disease is nearly{" "}
              <strong className="font-black">100%</strong>. The current spending
              ratio is the opposite of what the actual risk distribution would
              justify.
            </li>
          </ul>

          <Paragraph>
            This is in the logical self-interest of{" "}
            <strong className="font-black">
              even the CEO of Lockheed Martin
            </strong>
            , because:
          </Paragraph>

          <ul className="space-y-4 pl-5 text-base font-bold leading-7 sm:text-lg sm:leading-8">
            <li className="list-disc">
              A 1% reduction in his bomb-selling commission is not as valuable
              as the continued existence of himself, his family, and the people
              he loves.
            </li>
            <li className="list-disc">
              Disease is very expensive to the economy.
            </li>
            <li className="list-disc">
              It is projected that if we did this reallocation and eradicated
              disease, Earth would be vastly more productive —{" "}
              <StrongValue
                param={
                  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                }
                valueOverride={`${Math.round(
                  (TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15.value -
                    1) *
                    100,
                )}% richer in 15 years`}
              />
              .
            </li>
          </ul>

          <Paragraph>
            Therefore even the CEO of Lockheed Martin&apos;s interest in the 1%
            reduction is nothing compared to the increase in the size of the
            total pie of resources available to humanity if we eradicate disease
            instead of eradicating each other.
          </Paragraph>

          <Paragraph>
            Therefore:{" "}
            <strong className="font-black">
              all you have to do to end war and disease is get 8 billion people
              to wear a shirt on the same day.
            </strong>
          </Paragraph>

          <Paragraph>
            It only costs approximately{" "}
            <StrongValue param={UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD} /> —
            which is literally{" "}
            <StrongValue
              param={TREATY_VALUE_TO_SHIRT_COST_RATIO}
              valueOverride={`${ratioFormatter.format(
                treatyValueToShirtCostRatio / 1_000_000,
              )} million`}
            />{" "}
            times less than the cost of war and disease on society. (We can
            calculate exactly how many times less.)
          </Paragraph>

          <Paragraph>
            Last time we ran the model, the projected value of the 1% Treaty
            alone was approximately{" "}
            <StrongValue
              param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE}
            />
            . But that is a <strong className="font-black">floor</strong>. If a
            billion people actually wore the shirt and had the conversation,
            they would not stop at 1%. They would cut much more.
          </Paragraph>

          <Paragraph>
            There should be a{" "}
            <strong className="font-black">slider on the site</strong> [coming
            next] so every human can adjust the proposed treaty cut and see the
            recalculated outcomes. At most the cut would be 50/50 — half of
            military spending redirected. If 8 billion humans actually talked to
            each other about what their priorities are, disease eradication and
            education could happen very fast.
          </Paragraph>

          <Paragraph>
            The{" "}
            <strong className="font-black">
              biotechnology sector would be a very good place to invest
            </strong>{" "}
            in advance of this.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading>
            Address the objection: yes, this sounds insane
          </SectionHeading>

          <Paragraph>
            Skeptical reader&apos;s first reaction: &quot;All you have to do to
            end war and disease is for everyone to wear a t-shirt? This sounds
            insane.&quot;
          </Paragraph>

          <Paragraph>Correct. It sounds insane.</Paragraph>

          <Paragraph>
            We have walked through the logical proof above. Identify the step
            where the logic breaks. If you cannot, the proposal is not insane —
            it is just unfamiliar.
          </Paragraph>

          <Paragraph>
            The fact that it sounds insane — and that it is simple enough for
            any human on Earth to understand — is why it works.
          </Paragraph>

          <Paragraph>
            Most things that would benefit everyone on Earth do not get done
            because they are too complex to coordinate around. They require
            expertise to evaluate, institutions to align, and decades to deploy.
            A t-shirt with a QR code linking to a 30-second vote requires none
            of that. A 5-year-old can read it. A 99-year-old can wear it. The
            action is trivial; the underlying argument has room to spread.
          </Paragraph>

          <Paragraph>
            Simplicity + universal benefit + universal comprehensibility is the
            rare combination that actually goes viral. The proposal is memetic
            precisely because the surface — wear a shirt — is trivial enough
            that the argument can ride along.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading>The escalation argument</SectionHeading>

          <Paragraph>
            Even though it starts at 1%, once humanity agrees that this is good,
            the natural next question is: if 1% is this good, why not 2%?
          </Paragraph>

          <Paragraph>
            If 2% eradicates diseases 20 times faster, why not 3%?
          </Paragraph>

          <Paragraph>
            The logical conclusion is that war is irrational. 8 billion people
            will realize how irrational it is to let 2 billion people suffer
            from disease so that humanity can maintain 122 apocalypses of
            mass-murder capacity when one is enough.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading>
            Comparative table: universal t-shirts vs. alternatives
          </SectionHeading>

          <Paragraph>
            This campaign is{" "}
            <ParameterValue
              className="font-black"
              param={TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG}
              display="withUnit"
            />
            , approximately{" "}
            <ParameterValue
              className="font-black"
              param={TREATY_VS_BED_NETS_MULTIPLIER}
              valueOverride={`${integerFormatter.format(
                Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value / 100) * 100,
              )}×`}
            />{" "}
            more cost-effective than ITNs.
          </Paragraph>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm font-bold leading-6">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Name
                  </th>
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    Current $/DALY benchmark
                  </th>
                  <th className="border-r-2 border-foreground px-3 py-3 align-bottom text-xs font-black uppercase">
                    DALYs at shirt-distribution cost
                  </th>
                  <th className="px-3 py-3 align-bottom text-xs font-black uppercase">
                    Ratio vs. this campaign
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-foreground">
                  <td className="border-r-2 border-foreground px-3 py-4 align-top">
                    GiveWell top charities (Against Malaria Foundation / Helen
                    Keller / Malaria Consortium)
                  </td>
                  <td className="border-r-2 border-foreground px-3 py-4 align-top">
                    <ParameterValue
                      className="font-black"
                      param={BED_NETS_COST_PER_DALY}
                      display="withUnit"
                    />
                  </td>
                  <td className="border-r-2 border-foreground px-3 py-4 align-top">
                    <ParameterValue
                      className="font-black"
                      param={GIVEWELL_DALYS_FOR_UNIVERSAL_SHIRT_COST}
                      display="withUnit"
                    />
                  </td>
                  <td className="px-3 py-4 align-top">
                    <ParameterValue
                      className="font-black"
                      param={TREATY_VS_BED_NETS_MULTIPLIER}
                      valueOverride={`${integerFormatter.format(
                        Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value / 100) *
                          100,
                      )}×`}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Paragraph>
            Cash-transfer programs (GiveDirectly) and longtermist AI-safety
            grants (Open Philanthropy AI Safety bucket, Future of Life
            Institute) do not publish DALY-denominated cost-effectiveness
            numbers, so direct row-by-row comparison is not possible. They are
            funded for different ideas about how to reduce suffering. The
            cost-per-DALY benchmark above is the standard global-health
            comparator, and this campaign clears it by ~50,000×.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading>Optional commitment path</SectionHeading>

          <Paragraph>
            If you want to commit but don&apos;t want the risk of going first,
            we can run a dominant assurance pledge — the same win-or-refund
            pattern the{" "}
            <Link
              href={prizeLink.href}
              className="underline decoration-dotted underline-offset-4"
            >
              Earth Optimization Prize
            </Link>{" "}
            uses — for shirt distribution. Tell us your pledge amount;
            we&apos;ll build the escrow path if we get three foundation pledges
            totaling ≥ $1 billion.
          </Paragraph>

          <Paragraph>Same commitment pattern, different outcome.</Paragraph>

          <ul className="space-y-4 pl-5 text-base font-bold leading-7 sm:text-lg sm:leading-8">
            <li className="list-disc">
              Pledges are held until the foundation threshold is met.
            </li>
            <li className="list-disc">
              Success path: enough foundations join, then funds release for
              bulk shirt distribution.
            </li>
            <li className="list-disc">
              Failure path: the threshold is not met, so pledged principal
              returns.
            </li>
            <li className="list-disc">
              No foundation has to be the reckless first mover.
            </li>
          </ul>

          <Paragraph>
            If pledges meet the threshold by Earth Optimization Day, funds
            release for the bulk shirt order. If they do not, your principal
            returns. No penalty for going first.
          </Paragraph>

          <Paragraph>
            Foundations carry{" "}
            <strong className="font-black">fear of going first</strong>:
            if Open Philanthropy commits $500M and no one else does, they look
            reckless. If Open Philanthropy <em>conditionally</em> commits $500M,
            it only deploys when the other ~$5B is committed by peers,{" "}
            <strong className="font-black">and</strong> the principal is
            preserved with yield until the threshold hits — that&apos;s not a
            reputation risk, that&apos;s prudent capital allocation.
          </Paragraph>

          <Paragraph>
            The assurance contract converts a coordination problem into a
            commitment structure.
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading>Pledge here.</SectionHeading>

          <Paragraph>
            Funds release only when the threshold is met. Principal returns
            with yield if it is not.
          </Paragraph>

          <TaskFundingProgress
            showBreakdown
            showUnitBreakdown
            status={fundingStatus}
            taskId={PLEDGE_SHIRT_TASK_ID}
          />

          {pledgeOrganization ? (
            <TaskFundingPledgeForm
              initialPublicDisplay
              labels={{
                amountLabel: "Pledge amount (USD)",
                publicDisplayLabel:
                  "Show our organization name publicly when the threshold is met.",
                submitButtonLabel: "Pledge conditionally",
              }}
              organizationId={pledgeOrganization.id}
              pledgerKind="ORGANIZATION"
              taskId={PLEDGE_SHIRT_TASK_ID}
              unitConfig={{
                suggestedAmountCents: 100_000_000n,
                unitKind: "USD",
              }}
            />
          ) : (
            <SignInPrompt
              href={getSignInPath(ROUTES.foundations)}
              label="Sign in as your organization to pledge"
            />
          )}
        </Section>

        <p className="mt-8 text-base font-black leading-7 sm:text-lg sm:leading-8">
          Want to coordinate with another human? Go on an{" "}
          <Link
            className="underline decoration-dotted underline-offset-4"
            href={ROUTES.missions}
          >
            Earth Optimization Mission
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
