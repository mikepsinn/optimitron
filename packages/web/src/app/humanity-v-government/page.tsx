import Link from "next/link";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import {
  CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA,
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  DFDA_QUEUE_CLEARANCE_YEARS,
  EFFICACY_LAG_YEARS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  GLOBAL_AVG_INCOME_2025,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PHARMA_LIVES_SAVED_ANNUAL,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  WAR_CHILDREN_KILLED_SINCE_1900,
  WAR_COUNTERFACTUAL_GDP_PER_CAPITA,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { WELFARE_CLAIM_AMOUNT_TEXT } from "@/components/shared/WelfareClaim.core";
import { JsonLdScript } from "@/components/site/JsonLdScript";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { authOptions } from "@/lib/auth";
import {
  buildHumanityVGovernmentStructuredData,
} from "@/lib/campaign-structured-data";
import { formatCount } from "@/lib/format-count";
import {
  getHumanityVGovernmentPlaintiffCount,
  getHumanityVGovernmentVerdictStats,
} from "@/lib/humanity-v-government-case.server";
import {
  HUMANITY_V_GOVERNMENT_MANUAL_URL,
  ROUTES,
} from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { DamagesSensitivityCalculator } from "./DamagesSensitivityCalculator";
import { HumanityVGovernmentVerdictVote } from "./HumanityVGovernmentVerdictVote";
import { HUMANITY_V_GOVERNMENT_METADATA } from "./page-metadata";

export const dynamic = "force-dynamic";

export const metadata = HUMANITY_V_GOVERNMENT_METADATA;

const CASE_CAPTION = {
  plaintiff: "Humanity",
  defendants: "Governments of Earth, collectively",
  charge:
    "Three counts: direct killing, regulatory delay, and misallocation of public money away from keeping humans alive.",
} as const;

export default async function HumanityVGovernmentPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const session = await getServerSession(authOptions);
  const [plaintiffCount, verdictStats] = await Promise.all([
    getHumanityVGovernmentPlaintiffCount(),
    getHumanityVGovernmentVerdictStats(session?.user?.id),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <JsonLdScript data={buildHumanityVGovernmentStructuredData(site)} />
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
        Court of Humanity - Damages case
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-[1.05] text-foreground sm:text-6xl">
        {CASE_CAPTION.plaintiff} v. {CASE_CAPTION.defendants.split(",")[0]}
      </h1>

      <section className="mt-8 border-2 border-foreground bg-background p-5 sm:p-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
          The indictment
        </p>
        <p className="mt-3 text-xl font-black leading-8 text-foreground sm:text-2xl sm:leading-9">
          Governments are paid{" "}
          <ParameterValue
            figures={3}
            param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
            valueOverride="$36.5 trillion"
          />{" "}
          a year to promote the general welfare, defined here as maximizing
          median healthy life expectancy and median after-tax
          inflation-adjusted income.
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
          Instead, these public servants used{" "}
          <ParameterValue
            figures={3}
            param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
            valueOverride="$170 trillion"
          />{" "}
          of their salary to murder approximately{" "}
          <ParameterValue
            figures={3}
            param={WAR_DEATHS_SINCE_1900}
            valueOverride="310 million"
          />{" "}
          humans over the last century of their employment.
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
          These murdered humans included roughly 930,000 doctors, 310,000
          scientists, 620,000 engineers, 1.24 million nurses, 3.1 million
          teachers, and{" "}
          <ParameterValue
            figures={3}
            param={WAR_CHILDREN_KILLED_SINCE_1900}
            valueOverride="102 million"
          />{" "}
          children who will never grow up to replace them.
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-foreground">
          Murdering your employers is the opposite of promoting their welfare,
          and would be grounds for termination in any other employment contract
          humans have ever signed.
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
          Had governments not spent{" "}
          <ParameterValue
            figures={3}
            param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
            valueOverride="$170 trillion"
          />{" "}
          murdering those people and destroying everything they spent their
          entire lives building, the average human alive today would earn{" "}
          <ParameterValue
            figures={3}
            param={WAR_COUNTERFACTUAL_GDP_PER_CAPITA}
            valueOverride="$333,636"
          />{" "}
          a year instead of{" "}
          <ParameterValue
            figures={3}
            param={GLOBAL_AVG_INCOME_2025}
            valueOverride="$14,375"
          />
          . Dead scientists do not discover things and exploded cities are
          very expensive to fix.{" "}
          <a
            className="text-foreground underline underline-offset-2"
            href={HUMANITY_V_GOVERNMENT_MANUAL_URL}
            rel="noreferrer"
            target="_blank"
          >
            Read the evidence
          </a>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          If governments were a corporation
        </h2>
        <div className="mt-3 border-2 border-foreground bg-background p-5 text-base font-bold leading-7 text-muted-foreground">
          <p>
            If a corporation were paid{" "}
            <ParameterValue
              figures={3}
              param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
              valueOverride="$36.5 trillion"
            />{" "}
            a year to promote the general welfare and misused the funds to
            this degree, it would be prosecuted, fined, monitored, and its
            officers imprisoned.
          </p>
          <p className="mt-3">
            The corporate analogy is conservative: ordinary corporations do not
            have the legal power to compel payment from every human under their
            jurisdiction.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          The case caption
        </h2>
        <dl className="mt-3 border-2 border-foreground bg-background p-5 text-sm font-bold leading-6">
          <div className="flex gap-4 border-b border-foreground pb-3">
            <dt className="w-32 shrink-0 text-muted-foreground">Plaintiff</dt>
            <dd className="text-foreground">
              {CASE_CAPTION.plaintiff} (
              <span
                className="tabular-nums"
                data-volatile="plaintiff-count"
              >
                {formatCount(plaintiffCount)}
              </span>{" "}
              named, accumulating)
            </dd>
          </div>
          <div className="flex gap-4 border-b border-foreground py-3">
            <dt className="w-32 shrink-0 text-muted-foreground">Defendants</dt>
            <dd className="text-foreground">{CASE_CAPTION.defendants}</dd>
          </div>
          <div className="flex gap-4 border-b border-foreground py-3">
            <dt className="w-32 shrink-0 text-muted-foreground">Charge</dt>
            <dd className="text-foreground">{CASE_CAPTION.charge}</dd>
          </div>
          <div className="flex gap-4 pt-3">
            <dt className="w-32 shrink-0 text-muted-foreground">Remedy</dt>
            <dd className="text-foreground">
              Record the finding, count the plaintiffs, and make the damages
              demand public enough that governments have to answer it.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Why this is a case
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Duty
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The duty purchased by that {WELFARE_CLAIM_AMOUNT_TEXT} annual
              payment is measurable: maximize median healthy life expectancy
              and median after-tax inflation-adjusted income.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Breach
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Governments spend{" "}
              <ParameterValue
                figures={3}
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                valueOverride="604"
              />{" "}
              times more on weapons than on testing which medicines work. The
              1% Treaty asks them to redirect{" "}
              <ParameterValue
                figures={2}
                param={TREATY_REDUCTION_PCT}
                valueOverride="1%"
              />{" "}
              of military spending to pragmatic clinical trials.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Causation
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              At the current discovery rate, finding first treatments for the
              remaining untreated diseases takes{" "}
              <ParameterValue
                figures={3}
                param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
                valueOverride="443 years"
              />
              . The treaty model compresses that queue to{" "}
              <ParameterValue
                figures={2}
                param={DFDA_QUEUE_CLEARANCE_YEARS}
                valueOverride="36 years"
              />
              .
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Damages
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The full claim is per living human because the survivors inherited
              the missing scientists, doctors, children, treatments, income, and
              public money destroyed by the policy.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          The three counts
        </h2>
        <ol className="mt-3 space-y-4">
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 1 — Death by War
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={WAR_DEATHS_SINCE_1900}
                valueOverride="310 million"
              />{" "}
              deaths
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The defendants, between 1900 and the present, did willfully and
              with premeditation engage in the organized killing of{" "}
              <ParameterValue
                figures={3}
                param={WAR_DEATHS_SINCE_1900}
                valueOverride="310 million"
              />{" "}
              of their own employers.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 2 — Death by Regulatory Delay
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL}
                valueOverride="102 million"
              />{" "}
              deaths
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The defendants required an additional{" "}
              <ParameterValue
                figures={2}
                param={EFFICACY_LAG_YEARS}
                valueOverride="8.2 years"
              />{" "}
              of efficacy testing before letting humans access drugs already
              proven safe. The damages model multiplies that post-safety lag
              by{" "}
              <ParameterValue
                figures={3}
                param={PHARMA_LIVES_SAVED_ANNUAL}
                valueOverride="12.4 million"
              />{" "}
              lives saved per year by existing drugs, yielding{" "}
              <ParameterValue
                figures={3}
                param={EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL}
                valueOverride="102 million"
              />{" "}
              deaths.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 3 — Death by Misallocation
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
                valueOverride="37,778"
              />{" "}
              trial-years
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Damages here are the counterfactual: what humanity would have
              had if governments had frozen real military spending at 1900
              levels and redirected the rest to keeping their citizens alive.
              The war budget since 1913 alone could have funded{" "}
              <ParameterValue
                figures={3}
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
                valueOverride="37,778"
              />{" "}
              years of government clinical trials.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          The damages demand
        </h2>
        <div className="mt-3 border-2 border-foreground bg-background p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Full damages claim
          </p>
          <p className="mt-2 text-4xl font-black tabular-nums leading-none text-foreground sm:text-5xl">
            <ParameterValue
              figures={3}
              param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
            />
          </p>
          <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
            The False Claims Act triples damages when a defendant defrauds the
            government. Here, the defendants ARE the government, defrauding the
            citizenry. Triple damages apply.
          </p>
        </div>
      </section>

      <div className="mt-10">
        <DamagesSensitivityCalculator />
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          The usual defenses
        </h2>
        <div className="mt-3 space-y-3">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              "These are policy disagreements."
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Negligent homicide requires duty, breach, causation, damages,
              and foreseeable risk. The defendants meet all five.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              "You cannot sue a government."
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              That is because governments wrote rules saying governments are
              hard to sue. This is not a moral defense. It is a confession with
              letterhead.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              "The deaths are counterfactual."
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Governments use counterfactual lives saved to justify budgets
              every day. The same math counts bodies when the budget kills
              people quietly instead.
            </p>
          </div>
        </div>
      </section>

      <div id="verdict" className="mt-10 scroll-mt-24">
        <HumanityVGovernmentVerdictVote
          existingAnswer={verdictStats.existingAnswer}
          fullDamagesLabel={
            <ParameterValue
              figures={3}
              param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
            />
          }
          question={
            <>
              Should the governments of Earth be found liable for preventable
              mass death and owe full damages of{" "}
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
              />?
            </>
          }
          referendumSlug={verdictStats.referendumSlug}
        />
      </div>

      <section className="mt-10 border-2 border-foreground bg-background p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Plaintiffs
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
          Name the humans the case should count.
        </h2>
        <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
          The case already has{" "}
          <span className="tabular-nums" data-volatile="plaintiff-count">
            {formatCount(plaintiffCount)}
          </span>{" "}
          named plaintiffs. If someone in your family died of war, regulatory
          delay, or preventable disease, add them. A civilization should at
          least be able to count these murdered humans.
        </p>
        <Link
          className={`${defaultButtonClassName} mt-5 tracking-[0.08em]`}
          href={ROUTES.plaintiffs}
        >
          Add a plaintiff
        </Link>
      </section>
    </main>
  );
}
