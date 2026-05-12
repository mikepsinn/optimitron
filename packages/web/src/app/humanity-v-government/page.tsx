import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL,
  HUMANITY_V_GOVERNMENT_VERDICT_QUESTION,
} from "@optimitron/data/referendums";
import {
  CORPORATE_DAMAGES_PROSECUTOR_BASE_ASK_PER_CAPITA,
  CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA,
  CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA,
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PENTAGON_UNACCOUNTED_FUNDS,
  WAR_CHILDREN_KILLED_SINCE_1900,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { authOptions } from "@/lib/auth";
import { formatCount } from "@/lib/format-count";
import {
  getHumanityVGovernmentPlaintiffCount,
  getHumanityVGovernmentVerdictStats,
} from "@/lib/humanity-v-government-case.server";
import {
  HUMANITY_V_GOVERNMENT_MANUAL_URL,
  ROUTES,
} from "@/lib/routes";
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
  const session = await getServerSession(authOptions);
  const [plaintiffCount, verdictStats] = await Promise.all([
    getHumanityVGovernmentPlaintiffCount(),
    getHumanityVGovernmentVerdictStats(session?.user?.id),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
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
          Governments were hired to promote the general welfare. They collect{" "}
          <ParameterValue
            figures={3}
            param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
            valueOverride="$36.5 trillion"
          />{" "}
          a year for the service.
        </p>
        <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
          Instead, since 1900, they spent about{" "}
          <ParameterValue
            figures={3}
            param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
            valueOverride="$170 trillion"
          />{" "}
          on war and killed approximately{" "}
          <ParameterValue
            figures={3}
            param={WAR_DEATHS_SINCE_1900}
            valueOverride="310 million"
          />{" "}
          of their own employers: the citizenry.
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
          The dead include roughly 930,000 doctors, 310,000 scientists, 620,000
          engineers, 1.24 million nurses, 3.1 million teachers, and{" "}
          <ParameterValue
            figures={3}
            param={WAR_CHILDREN_KILLED_SINCE_1900}
            valueOverride="102 million"
          />{" "}
          children who will not grow up to replace them.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className="inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-background hover:bg-background hover:text-foreground"
            href="#verdict"
          >
            Vote on the finding
          </a>
          <Link
            className="inline-block border-2 border-foreground bg-background px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:bg-foreground hover:text-background"
            href={ROUTES.vote}
          >
            Support the settlement
          </Link>
          <a
            className="inline-block border-2 border-foreground bg-background px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:bg-foreground hover:text-background"
            href={HUMANITY_V_GOVERNMENT_MANUAL_URL}
            rel="noreferrer"
            target="_blank"
          >
            Read the evidence
          </a>
        </div>
      </section>

      <div id="verdict" className="mt-10 scroll-mt-24">
        <HumanityVGovernmentVerdictVote
          abstainCount={verdictStats.abstainCount}
          existingAnswer={verdictStats.existingAnswer}
          fullDamagesLabel={HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL}
          noCount={verdictStats.noCount}
          question={HUMANITY_V_GOVERNMENT_VERDICT_QUESTION}
          referendumSlug={verdictStats.referendumSlug}
          yesCount={verdictStats.yesCount}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          If this were a corporation
        </h2>
        <div className="mt-3 border-2 border-foreground bg-background p-5 text-base font-bold leading-7 text-muted-foreground">
          <p>
            If a corporation took{" "}
            <ParameterValue
              figures={3}
              param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
              valueOverride="$36.5 trillion"
            />{" "}
            a year to protect its customers, spent{" "}
            <ParameterValue
              figures={3}
              param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              valueOverride="$170 trillion"
            />{" "}
            on weapons, failed to account for{" "}
            <ParameterValue
              figures={3}
              param={PENTAGON_UNACCOUNTED_FUNDS}
              valueOverride="$2.46 trillion"
            />
            , and left the customers dead, prosecutors would not call it a
            policy disagreement.
          </p>
          <p className="mt-3 text-foreground">
            They would call it a case.
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
              The 1% Treaty is the settlement: redirect 1% of military spending
              to clinical trials. Not because governments became wise. Because
              one percent is cheaper than the damages.
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
              Governments accept compulsory payment to protect the public and
              promote the general welfare. That is the job description.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Breach
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              They spend{" "}
              <ParameterValue
                figures={3}
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                valueOverride="604"
              />{" "}
              times more on military capacity than on government clinical
              trials. Disease is what actually kills their citizens.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Causation
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Some deaths were direct. Others happened because treatments were
              delayed, trials were not funded, and the cure money became
              hardware for organized killing.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Damages
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The cautious floor is{" "}
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA}
                valueOverride="$538K"
              />{" "}
              per living human. The prosecutor's base demand is{" "}
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_PROSECUTOR_BASE_ASK_PER_CAPITA}
                valueOverride="$913K"
              />
              .
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
              Count 1 — Direct Killing
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={WAR_DEATHS_SINCE_1900}
                valueOverride="310 million"
              />{" "}
              deaths
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              War, conflict, genocide, and policy famine since 1900. The
              defendants chose the budgets, signed the orders, and proceeded.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 2 — Regulatory Delay
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL}
                valueOverride="102 million"
              />{" "}
              deaths
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Patients who died waiting 8.2 extra years for already-safe drugs
              to be proven effective. The waiting room had a body count.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 3 — Misallocation
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
                valueOverride="37,778"
              />{" "}
              trial-years
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              The war budget since 1913 could have funded nearly thirty-eight
              thousand years of government clinical trials. They bought the
              other thing.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          The damages demand
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Cautious floor
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA}
                valueOverride="$538K"
              />
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Per living human, before punitive theories.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Prosecutor demand
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_PROSECUTOR_BASE_ASK_PER_CAPITA}
                valueOverride="$913K"
              />
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Adds drugs never developed because the trials were never funded.
            </p>
          </div>
          <div className="border-2 border-foreground bg-foreground p-4 text-background">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-background">
              Triple damages
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              <ParameterValue
                className="text-background decoration-background/50"
                figures={3}
                param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
                valueOverride="$2.74M"
              />
            </p>
            <p className="mt-1 text-xs font-bold text-background">
              Some fraud laws triple the damages. This is that argument.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-muted-foreground">
          The demand is not one suspicious monster number. It is a ledger: war
          deaths, regulatory delay deaths, destroyed property, missing public
          money, and the cures never developed because the research budget was
          busy becoming weapons.
        </p>
        <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
          <span className="font-black text-foreground">Alternative pleadings.</span>{" "}
          If the court rejects the wider theory, the case still has the floor:{" "}
          <ParameterValue
            figures={3}
            param={CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA}
            valueOverride="$538K"
          />{" "}
          per person. If it accepts a False Claims Act-style triple-damages
          analogy,
          exposure reaches{" "}
          <ParameterValue
            figures={3}
            param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
            valueOverride="$2.74M"
          />{" "}
          per person. Governments will say this is too much money. They should
          have thought of that before the mass casualty event.
        </p>
      </section>

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
              No. Negligent homicide does not require evil laughter. It requires
              duty, breach, causation, damages, and foreseeable risk. Those are
              the boring parts of law. They are also the parts that matter.
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
          least be able to count its dead.
        </p>
        <Link
          className="mt-5 inline-block border-2 border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:bg-foreground hover:text-background"
          href={ROUTES.plaintiffs}
        >
          Add a plaintiff
        </Link>
      </section>

      <div className="mt-10">
        <DamagesSensitivityCalculator />
      </div>
    </main>
  );
}
