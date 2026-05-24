import { VotePosition } from "@optimitron/db";
import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  DEFENSE_LOBBYING_ANNUAL,
  DEFENSE_SECTOR_RETENTION_PCT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DISEASE_BURDEN_GDP_DRAG_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  POST_WW2_MILITARY_CUT_PCT,
  SEPT_11_DEATHS,
  SHIRT_INDUCED_LAUGHS_GAINED,
  SHIRT_SEED_WEARERS_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_CAMPAIGN_BUDGET_LOBBYING,
  TREATY_REDUCTION_PCT,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  type Parameter,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
} from "@optimitron/data/parameters";
import { getServerSession } from "next-auth";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { CampaignQrCode } from "@/components/sharing/campaign-qr-code";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { authOptions } from "@/lib/auth";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { SHIRT_BACK_COPY_LINES, SHIRT_FRONT_COPY } from "@/lib/messaging";
import { getRouteMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { jokeLink, ROUTES } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildReferralUrl } from "@/lib/url";
import { JokePrintButton } from "./joke-client";

const paragraphClass = "text-lg font-bold leading-8 text-foreground";
const manualBase = "https://manual.warondisease.org/knowledge";
const genericVoteUrl = `${WAR_ON_DISEASE_CANONICAL_ORIGIN}${ROUTES.vote}`;
const displayDomain = WAR_ON_DISEASE_CANONICAL_ORIGIN.replace(
  /^https?:\/\//,
  "",
);

const DAILY_DISEASE_DEATHS_IN_911_EQUIVALENTS: Parameter = {
  value: GLOBAL_DISEASE_DEATHS_DAILY.value / SEPT_11_DEATHS.value,
  parameterName: "DAILY_DISEASE_DEATHS_IN_911_EQUIVALENTS",
  calculationsUrl: GLOBAL_DISEASE_DEATHS_DAILY.calculationsUrl,
  unit: "ratio",
  displayName: "Daily Disease Deaths in September 11 Equivalents",
  description:
    "Total daily global deaths from disease and aging divided by the September 11 death toll. This is a scale comparison, not an argument that the events are otherwise similar.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_DISEASE_DEATHS_DAILY / SEPT_11_DEATHS",
  manualPageUrl: GLOBAL_DISEASE_DEATHS_DAILY.manualPageUrl,
  manualPageTitle: GLOBAL_DISEASE_DEATHS_DAILY.manualPageTitle,
};

const ONE_LAUGH_PER_HEALTHY_DAY_GAINED: Parameter = {
  value: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value * 365,
  parameterName: "ONE_LAUGH_PER_HEALTHY_DAY_GAINED",
  calculationsUrl:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.calculationsUrl,
  unit: "laughs",
  displayName: "Laughs Added at One Laugh Per Healthy Day",
  description:
    "A deliberately conservative laugh count: DALYs averted by the treatment timeline shift multiplied by one laugh per recovered healthy day.",
  sourceType: "calculated",
  confidence: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.confidence,
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS * 365",
  manualPageUrl: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.manualPageUrl,
  manualPageTitle: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.manualPageTitle,
};

export const metadata = getRouteMetadata(jokeLink);

async function getPersonalReferralUrl() {
  const session = await getServerSession(authOptions);
  const referralIdentifier = getHandleOrReferralCode(session?.user);

  if (!session?.user?.id || !referralIdentifier) {
    return null;
  }

  const yesVote = await prisma.referendumVote.findFirst({
    where: {
      answer: VotePosition.YES,
      deletedAt: null,
      referendum: {
        deletedAt: null,
        slug: TREATY_REFERENDUM_SLUG,
      },
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!yesVote) {
    return null;
  }

  return buildReferralUrl(referralIdentifier, WAR_ON_DISEASE_CANONICAL_ORIGIN);
}

function Step({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="border border-foreground bg-background p-5">
      <p className="text-sm font-black uppercase text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black uppercase leading-none sm:text-4xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function MathTile({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="border border-foreground bg-background p-4">
      <div className="text-3xl font-black uppercase leading-none sm:text-4xl">
        {children}
      </div>
      <p className="mt-2 text-sm font-black uppercase leading-tight text-muted-foreground">
        {label}
      </p>
    </section>
  );
}

function TreatyReductionValue() {
  return <ParameterValue param={TREATY_REDUCTION_PCT} valueOverride="1%" />;
}

function ApocalypseNumberValue() {
  return (
    <ParameterValue
      param={NUCLEAR_WINTER_OVERKILL_FACTOR}
      valueOverride="121"
    />
  );
}

function ManualLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a className="underline underline-offset-4" href={href}>
      {children}
    </a>
  );
}

function Objection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="border-b border-foreground py-5">
      <summary className="cursor-pointer text-lg font-black uppercase leading-tight marker:text-foreground">
        {title}
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

function ShirtCopyBlock({ referralUrl }: { referralUrl: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="border border-foreground p-4">
        <h3 className="text-sm font-black uppercase text-muted-foreground">
          Front
        </h3>
        <p className="mt-3 text-4xl font-black uppercase leading-none sm:text-5xl">
          {SHIRT_FRONT_COPY}
        </p>
      </section>
      <section className="border border-foreground p-4">
        <h3 className="text-sm font-black uppercase text-muted-foreground">
          Back
        </h3>
        <p className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">
          {SHIRT_BACK_COPY_LINES.join(" ")}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <p className="min-w-0 flex-1 break-words text-xl font-black leading-tight">
            {displayDomain}
          </p>
          <CopyLinkButton
            url={referralUrl}
            idleLabel="Copy"
            copiedLabel="Copied"
            className="w-fit shrink-0 border border-foreground bg-foreground font-black uppercase text-background shadow-none hover:translate-y-0 hover:bg-background hover:text-foreground active:translate-x-0 active:translate-y-0"
          />
        </div>
      </section>
    </div>
  );
}

function HandoutFact({ children }: { children: ReactNode }) {
  return (
    <li className="border-b border-foreground py-3 text-xl font-black leading-tight last:border-b-0">
      {children}
    </li>
  );
}

function PrintableJokeHandout({
  hasPersonalReferralUrl,
  referralUrl,
}: {
  hasPersonalReferralUrl: boolean;
  referralUrl: string;
}) {
  return (
    <section className="space-y-4" id="print-handout">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        data-print-hidden="true"
      >
        <div>
          <h2 className="text-3xl font-black uppercase leading-none sm:text-4xl">
            Handout to include with the shirt
          </h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Print both sides and put it with the shirt.
          </p>
          {!hasPersonalReferralUrl ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              The QR code can use your share link.{" "}
              <Link className="underline underline-offset-4" href={ROUTES.signIn}>
                Sign in
              </Link>{" "}
              and vote yes to personalize it.
            </p>
          ) : null}
        </div>
        <JokePrintButton label="Print handout" />
      </div>

      <div className="space-y-4">
        <article className="joke-handout-sheet bg-background p-6 text-foreground">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase leading-none text-muted-foreground">
                Please read before yelling
              </p>
              <h3 className="mt-2 text-5xl font-black uppercase leading-none">
                Why I wrote on your shirts
              </h3>
              <p className="mt-4 text-xl font-bold leading-snug">
                You were given this shirt because someone correctly loves you
                and would prefer that you not be processed by preventable
                disease while humanity funds spare apocalypses.
              </p>
              <p className="mt-3 text-xl font-bold leading-snug">
                Disease kills{" "}
                <ParameterValue
                  param={GLOBAL_DISEASE_DEATHS_DAILY}
                  presentation="inline"
                  valueOverride="150,000 humans/day"
                />
                , about{" "}
                <ParameterValue
                  param={DAILY_DISEASE_DEATHS_IN_911_EQUIVALENTS}
                  presentation="inline"
                  valueOverride="50"
                />{" "}
                September 11s every day. Nobody invades anyone because disease
                has no flag.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-background">
                <CampaignQrCode value={referralUrl} />
              </div>
              <p className="break-all text-center text-xs font-black uppercase leading-tight">
                {displayDomain}
              </p>
            </div>
          </div>

          <ol className="mt-6 border-y border-foreground">
            <HandoutFact>
              Your chance of dying of disease: nearly 100%. Your chance of
              dying of terrorism: 1 in{" "}
              <ParameterValue
                param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR}
                presentation="inline"
                valueOverride="30,000,000"
              />
              .
            </HandoutFact>
            <HandoutFact>
              Governments spend{" "}
              <ParameterValue
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                presentation="inline"
                valueOverride="604x"
              />{" "}
              more on weapons than on government clinical trials.
            </HandoutFact>
            <HandoutFact>
              Before WWII, US military spending was{" "}
              <ParameterValue
                param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
                presentation="inline"
              />{" "}
              lower. After winning, the US cut it{" "}
              <ParameterValue
                param={POST_WW2_MILITARY_CUT_PCT}
                presentation="inline"
              />{" "}
              in two years.
            </HandoutFact>
            <HandoutFact>
              The 1% Treaty buys about{" "}
              <ParameterValue
                param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
                presentation="inline"
                valueOverride="12.3x"
              />{" "}
              as much clinical-trial capacity, so we are projected to find
              treatments for all diseases in{" "}
              <ParameterValue
                param={DFDA_QUEUE_CLEARANCE_YEARS}
                presentation="inline"
                valueOverride="36 years"
              />{" "}
              instead of{" "}
              <ParameterValue
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                presentation="inline"
                valueOverride="443 years"
              />
              .
            </HandoutFact>
            <HandoutFact>
              The average human becomes about{" "}
              <ParameterValue
                param={
                  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                }
                presentation="inline"
                valueOverride="4x"
              />{" "}
              richer and much less diseased and dead. The spreadsheet stops
              killing people.
            </HandoutFact>
          </ol>

          <p className="mt-5 text-2xl font-black uppercase leading-tight">
            Vote. Then write this on two more shirts. Social proof handles the
            part your facts cannot.
          </p>
        </article>

        <article className="joke-handout-sheet bg-background p-6 text-foreground">
          <p className="text-sm font-black uppercase leading-none text-muted-foreground">
            The yelling part
          </p>
          <h3 className="mt-2 text-5xl font-black uppercase leading-none">
            Answers for the person currently yelling at you
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="border-t border-foreground pt-3">
              <h4 className="text-xl font-black uppercase leading-tight">
                But national security.
              </h4>
              <p className="mt-2 text-base font-bold leading-snug">
                National security improves. Every country makes the same
                one-budget-line trade, so everyone has{" "}
                <TreatyReductionValue /> fewer weapons pointed at them and keeps{" "}
                <ParameterValue
                  param={DEFENSE_SECTOR_RETENTION_PCT}
                  presentation="inline"
                  valueOverride="99%"
                />
                . Humanity still has about <ApocalypseNumberValue /> spare
                apocalypses. That is enough murder capacity.
              </p>
            </section>

            <section className="border-t border-foreground pt-3">
              <h4 className="text-xl font-black uppercase leading-tight">
                We cannot afford it.
              </h4>
              <p className="mt-2 text-base font-bold leading-snug">
                Disease already burns{" "}
                <ParameterValue
                  param={GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL}
                  presentation="inline"
                />{" "}
                in lost work and drags off{" "}
                <ParameterValue
                  param={DISEASE_BURDEN_GDP_DRAG_PCT}
                  presentation="inline"
                />{" "}
                of global GDP. The current arrangement is what nobody can
                afford.
              </p>
            </section>

            <section className="border-t border-foreground pt-3">
              <h4 className="text-xl font-black uppercase leading-tight">
                Who would block this?
              </h4>
              <p className="mt-2 text-base font-bold leading-snug">
                Nobody rational. Defense contractors keep{" "}
                <ParameterValue
                  param={DEFENSE_SECTOR_RETENTION_PCT}
                  presentation="inline"
                  valueOverride="99%"
                />
                , lose one unusable apocalypse, and get an economy about{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                  }
                  presentation="inline"
                  valueOverride="4x"
                />{" "}
                larger where their children are alive to spend the money.
              </p>
            </section>

            <section className="border-t border-foreground pt-3">
              <h4 className="text-xl font-black uppercase leading-tight">
                Then why has nobody done it?
              </h4>
              <p className="mt-2 text-base font-bold leading-snug">
                Because the facts are scattered. Put them in eight billion
                brains at once and the insanity becomes visible: change the
                spreadsheet, keep the deterrent, fund the trials, stop dying.
              </p>
            </section>
          </div>

          <div className="mt-5 border-y border-foreground py-4">
            <p className="text-lg font-bold leading-snug">
              The avoided centuries of untreated disease prevent{" "}
              <ParameterValue
                param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED}
                presentation="inline"
                valueOverride="10.7 billion deaths"
              />{" "}
              and{" "}
              <ParameterValue
                param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS}
                presentation="inline"
                valueOverride="1.93 quadrillion hours"
              />{" "}
              of suffering. At one laugh per recovered healthy day, that is{" "}
              <ParameterValue
                param={ONE_LAUGH_PER_HEALTHY_DAY_GAINED}
                presentation="inline"
                valueOverride="206 trillion"
              />{" "}
              extra laughs. The full laugh-rate model counts{" "}
              <ParameterValue
                param={SHIRT_INDUCED_LAUGHS_GAINED}
                presentation="inline"
                valueOverride="3.5 quadrillion"
              />
              .
            </p>
          </div>

          <p className="mt-5 text-2xl font-black uppercase leading-tight">
            Warondisease.org. Vote first. Yell later.
          </p>
        </article>
      </div>
    </section>
  );
}

export default async function JokePage() {
  const personalReferralUrl = await getPersonalReferralUrl();
  const referralUrl = personalReferralUrl ?? genericVoteUrl;

  return (
    <main className="joke-root min-h-screen bg-background text-foreground">
      <style>{`
        .joke-handout-sheet {
          box-sizing: border-box;
          max-width: 8.5in;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        @media print {
          @page {
            size: letter;
            margin: 0.35in;
          }

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
          [data-print-hidden="true"],
          [data-joke-screen-only="true"] {
            display: none !important;
          }

          main {
            min-height: 0 !important;
          }

          .joke-root {
            min-height: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .joke-root > div {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .joke-handout-sheet {
            width: auto !important;
            height: 10.2in !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-color: #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          .joke-handout-sheet:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }

          #print-handout,
          #print-handout > div {
            margin: 0 !important;
          }

          #print-handout .joke-handout-sheet + .joke-handout-sheet {
            margin-top: 0 !important;
          }

          .joke-handout-sheet * {
            border-color: #000000 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section
          className="space-y-6 border-b border-foreground pb-10"
          data-joke-screen-only="true"
        >
          <h1 className="text-5xl font-black uppercase leading-none sm:text-6xl md:text-7xl">
            How to play the funniest joke in the universe
          </h1>
          <p className="max-w-3xl text-2xl font-black leading-tight">
            Put the treaty on a shirt. Put the shirt on a human. Put the facts
            in their hand before they start yelling.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex border border-foreground bg-foreground px-5 py-3 text-base font-black uppercase text-background hover:bg-background hover:text-foreground"
              href={ROUTES.vote}
            >
              Vote yes
            </Link>
            <a
              className="inline-flex border border-foreground bg-background px-5 py-3 text-base font-black uppercase text-foreground hover:bg-foreground hover:text-background"
              href="#print-handout"
            >
              Print the handout
            </a>
          </div>
        </section>

        <section
          className="grid gap-4 md:grid-cols-4"
          data-joke-screen-only="true"
        >
          <MathTile label="die of disease and aging every day">
            <ParameterValue
              param={GLOBAL_DISEASE_DEATHS_DAILY}
              valueOverride="150,000"
            />
          </MathTile>
          <MathTile label="September 11 equivalents every day">
            <ParameterValue
              param={DAILY_DISEASE_DEATHS_IN_911_EQUIVALENTS}
              valueOverride="50"
            />
          </MathTile>
          <MathTile label="more on weapons than clinical trials">
            <ParameterValue
              param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              valueOverride="604x"
            />
          </MathTile>
          <MathTile label="richer average human">
            <ParameterValue
              param={
                TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
              }
              valueOverride="4x"
            />
          </MathTile>
        </section>

        <section
          className="grid gap-4 md:grid-cols-2"
          data-joke-screen-only="true"
        >
          <Step eyebrow="Step 1" title="Vote yes.">
            <p className={paragraphClass}>
              The joke is funnier if you are not asking other people to do the
              thing you avoided doing. Vote on the 1% Treaty first.
            </p>
          </Step>

          <Step eyebrow="Step 2" title="Write the shirt.">
            <p className={paragraphClass}>
              A bought shirt works. A shirt you already own plus a permanent
              marker also works. The shirt is text. Text costs marker ink.
            </p>
          </Step>

          <Step eyebrow="Step 3" title="Include the handout.">
            <p className={paragraphClass}>
              The handout puts the facts in their hand before the yelling
              starts.
            </p>
          </Step>

          <Step eyebrow="Step 4" title="Propagate.">
            <p className={paragraphClass}>
              Write it on the rest of your shirts. Write it on your
              friends&apos; shirts if your friendship has survived worse things.
              The joke stops being a joke when humanity gets the point.
            </p>
          </Step>
        </section>

        <section className="space-y-4" data-joke-screen-only="true">
          <h2 className="text-3xl font-black uppercase leading-none sm:text-4xl">
            Write this
          </h2>
          <ShirtCopyBlock referralUrl={referralUrl} />
        </section>

        <PrintableJokeHandout
          hasPersonalReferralUrl={Boolean(personalReferralUrl)}
          referralUrl={referralUrl}
        />

        <section
          className="space-y-5 border-t border-foreground pt-10"
          data-joke-screen-only="true"
        >
          <h2 className="text-3xl font-black uppercase leading-none sm:text-4xl">
            When they ask why
          </h2>
          <p className={paragraphClass}>
            The handout gets them to the vote. These are the answers for the
            human currently pointing at the shirt and demanding evidence.
          </p>
          <div className="border-t border-foreground">
            <Objection title="But we need the military budget.">
              <p className={paragraphClass}>
                Your annual chance of dying in a terrorist attack is about 1 in{" "}
                <ParameterValue
                  param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR}
                  valueOverride="30 million"
                />
                . Your chance of dying from disease is still 100%. The treaty
                changes one budget line. Every country makes the same trade at
                the same time and keeps{" "}
                <ParameterValue
                  param={DEFENSE_SECTOR_RETENTION_PCT}
                  valueOverride="99%"
                />{" "}
                of its military budget, so relative military balance stays the
                same. Humanity still keeps roughly <ApocalypseNumberValue />{" "}
                spare apocalypses, which is a suspicious amount of deterrence.
              </p>
              <p className={paragraphClass}>
                Disease already burns{" "}
                <ParameterValue param={GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL} />
                {" "}
                in lost work and drags off{" "}
                <ParameterValue param={DISEASE_BURDEN_GDP_DRAG_PCT} />{" "}
                of global GDP before you even count the funerals. War smashes
                infrastructure. Disease smashes the workers. The current
                arrangement is what nobody can afford.
              </p>
            </Objection>

            <Objection title="1% is unrealistic.">
              <p className={paragraphClass}>
                Immediately before the United States won World War II, US
                military spending was{" "}
                <ParameterValue
                  param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
                />{" "}
                lower than current levels. After winning, the US cut military
                spending <ParameterValue param={POST_WW2_MILITARY_CUT_PCT} />{" "}
                over two years and then built the middle class. Your
                grandparents handled that. This shirt asks for{" "}
                <TreatyReductionValue />.
              </p>
            </Objection>

            <Objection title="The military-industrial complex will never allow it.">
              <p className={paragraphClass}>
                The CEO of Lockheed Martin is not exempt from biology. They can
                keep roughly <ApocalypseNumberValue /> spare apocalypses, watch
                their family die of curable diseases, and retire into the
                current trajectory. Or they can keep{" "}
                <ParameterValue
                  param={DEFENSE_SECTOR_RETENTION_PCT}
                  valueOverride="99%"
                />{" "}
                of the military budget, give up the unusable apocalypse, invest
                in the biotech sector absorbing redirected trial money, and
                retire in an economy{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                  }
                  valueOverride="4.1x"
                />{" "}
                larger where their children are alive to spend the money.
                Blocking the treaty to protect the last <TreatyReductionValue />{" "}
                is not self-interest. It is arithmetic failure with a lobbyist.
              </p>
            </Objection>

            <Objection title="Politicians will never agree.">
              <p className={paragraphClass}>
                Politicians follow pressure they can see. Right now the defense
                lobby spends{" "}
                <ParameterValue param={DEFENSE_LOBBYING_ANNUAL} /> buying the
                spreadsheet. The treaty campaign budget is{" "}
                <ParameterValue param={TREATY_CAMPAIGN_BUDGET_LOBBYING} />. If
                eight billion humans understand that the spreadsheet is killing
                them, changing the numbers becomes the boring part.
              </p>
              <p className={paragraphClass}>
                Defense contractors spend{" "}
                <ParameterValue param={DEFENSE_LOBBYING_ANNUAL} /> because
                lobbying works. Fine. After the treaty passes, politicians who
                voted yes receive{" "}
                <ManualLink
                  href={`${manualBase}/solution/incentive-alignment-bonds.html`}
                >
                  Incentive Alignment Bond
                </ManualLink>{" "}
                benefits: campaign support while running, cushy careers when
                done. Politicians who vote no receive nothing. This is
                Pavlovian conditioning, but for senators.
              </p>
            </Objection>

            <Objection title="What if countries cheat or refuse?">
              <p className={paragraphClass}>
                Of course some will try. The system does not use trust. It uses
                published disbursements, trial-linked payouts, the{" "}
                <ManualLink
                  href={`${manualBase}/solution/decentralized-accountability-office.html`}
                >
                  Decentralized Accountability Office
                </ManualLink>
                , and the{" "}
                <ManualLink
                  href={`${manualBase}/solution/automated-revenue-service.html`}
                >
                  Automated Revenue Service
                </ManualLink>
                . The first country to sign makes refusal more visible and more
                expensive for the next one.
              </p>
            </Objection>

            <Objection title="Why put it on shirts?">
              <p className={paragraphClass}>
                A human wearing this on purpose is making a political
                declaration. A human wearing it because someone defaced their
                closet has a funny story. That drops the social cost from
                &quot;I am advocating&quot; to &quot;you will not believe what
                happened,&quot; which is the conversation humans actually like
                having.
              </p>
              <p className={paragraphClass}>
                Most pranks cost the prankster something. This one earns VOTE
                points, makes the recipient a walking billboard for not dying,
                and counts each unwitting wearer toward the{" "}
                <ParameterValue
                  param={SHIRT_SEED_WEARERS_THRESHOLD}
                  valueOverride="1 million"
                />{" "}
                social-proof threshold. The joke spreads itself. Play the joke.
              </p>
            </Objection>
          </div>
        </section>

        <section
          className="space-y-5 border-t border-foreground pt-10"
          data-joke-screen-only="true"
        >
          <h2 className="text-3xl font-black uppercase leading-none sm:text-4xl">
            Why the joke is funny
          </h2>
          <p className={paragraphClass}>
            The average human laughs{" "}
            <ParameterValue param={HUMAN_LAUGHS_PER_DAY_AVERAGE} /> times per
            day, about{" "}
            <ParameterValue
              param={HUMAN_LAUGHS_PER_HEALTHY_LIFE_YEAR}
              valueOverride="6,200"
            />{" "}
            times per healthy life-year. If the shirt-triggered cascade helps
            make disease eradication arrive on the treaty timeline, the model
            counts <ParameterValue param={SHIRT_INDUCED_LAUGHS_GAINED} />{" "}
            additional laughs. This does not count the laughs of future humans
            who exist because humanity stopped spending its repair money on
            spare apocalypses.
          </p>
          <p className={paragraphClass}>
            The shirt asks humanity to trade{" "}
            <ParameterValue
              param={TREATY_REDUCTION_PCT}
              valueOverride="1%"
            />{" "}
            of military spending for disease eradication in{" "}
            <ParameterValue
              param={DFDA_QUEUE_CLEARANCE_YEARS}
              valueOverride="36 years"
            />{" "}
            instead of{" "}
            <ParameterValue
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              valueOverride="443 years"
            />
            . Humanity still keeps roughly{" "}
            <ParameterValue
              param={NUCLEAR_WINTER_OVERKILL_FACTOR}
              valueOverride="121"
            />{" "}
            extra apocalypses. The extra apocalypses will have to find a hobby.
          </p>
          <p className={paragraphClass}>
            <a
              className="underline underline-offset-4"
              href={`${manualBase}/appendix/joke.html`}
            >
              Read the full philosophical footnotes in the manual.
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
