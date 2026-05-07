import type { Metadata } from "next";
import Link from "next/link";
import {
  CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA,
  CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA,
  CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA,
  DEMOCIDE_TOTAL_20TH_CENTURY,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { formatCount } from "@/lib/format-count";
import { getHumanityVGovernmentPlaintiffCount } from "@/lib/humanity-v-government-case.server";
import { HUMANITY_V_GOVERNMENT_MANUAL_URL, ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Humanity v Government — The Case",
  description:
    "Three counts of negligent mass homicide. Demanded recovery $10.6M–$25.2M per plaintiff. The verdict is the 1% Treaty referendum.",
};

const CASE_CAPTION = {
  plaintiff: "Humanity",
  defendants: "Governments of Earth, collectively",
  charge:
    "Three counts of negligent mass homicide (Direct Killing, Regulatory Delay, Misallocation).",
} as const;

export default async function HumanityVGovernmentPage() {
  const plaintiffCount = await getHumanityVGovernmentPlaintiffCount();

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
        Court of Humanity — Open case
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-[1.05] text-foreground sm:text-6xl">
        {CASE_CAPTION.plaintiff} v. {CASE_CAPTION.defendants.split(",")[0]}
      </h1>

      <section className="mt-8 border-2 border-foreground bg-background p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          You are summoned
        </p>
        <p className="mt-2 text-base font-bold leading-7 text-foreground">
          You have been called as juror{" "}
          <span className="tabular-nums">
            #{formatCount(plaintiffCount + 1)}
          </span>
          . You are also a named plaintiff. Your share of the demanded recovery:{" "}
          <span className="font-black">$10.6M (NPV)</span> —{" "}
          <span className="font-black">$25.2M (lifetime cohort)</span>.
        </p>
        <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
          The verdict is the 1% Treaty. The case binds governments only when
          four billion plaintiffs render it. Recruit two more jurors. The case
          is the chain.
        </p>
        <Link
          className="mt-5 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-background hover:bg-background hover:text-foreground"
          href={ROUTES.vote}
        >
          Render the verdict — sign the treaty
        </Link>
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
              <span className="tabular-nums">{formatCount(plaintiffCount)}</span>{" "}
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
            <dt className="w-32 shrink-0 text-muted-foreground">Settlement</dt>
            <dd className="text-foreground">
              The 1% Treaty: redirect 1% of military spending to clinical
              trials. Defendants who ratify accept the settlement. Defendants
              who do not remain in default.
            </dd>
          </div>
        </dl>
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
              War and conflict deaths since 1900. Defendants chose the policy
              and proceeded.
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
              Patients who died waiting 8.2 years for already-safe drugs to be
              proven effective. 1962 Kefauver-Harris Amendments through today.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Count 3 — Misallocation
            </p>
            <p className="mt-2 text-3xl font-black tabular-nums text-foreground sm:text-4xl">
              <ParameterValue
                param={DEMOCIDE_TOTAL_20TH_CENTURY}
                valueOverride="262 million"
              />{" "}
              deaths
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              20th-century government democide. Resources spent on killing,
              not on the disease that kills 150,000 humans every day.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Demanded recovery, per plaintiff
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Primary theory (NPV)
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA}
                valueOverride="$10.6M"
              />
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Lost-prosperity-only, NPV at 3%, no-cure baseline.
            </p>
          </div>
          <div className="border-2 border-foreground bg-foreground p-4 text-background">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-background">
              Headline (cohort)
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              $25.2M
            </p>
            <p className="mt-1 text-xs font-bold text-background">
              Lost-prosperity-only, lifetime, representative full-life cohort.
            </p>
          </div>
          <div className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Constitutional ceiling
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums leading-none">
              $9.13M
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              State Farm-style 10× exposure, alternative pleading.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-muted-foreground">
          <span className="font-black text-foreground">Why $25.2M.</span>{" "}
          Governments collected $36.5T/year to "promote the general welfare"
          and underdelivered. The lost-prosperity theory compares delivered
          welfare to a benchmark where disease was being seriously addressed;
          the gap is the per-person deficiency. This is antitrust-style
          lost-profits — the framework prosecutors actually win with against
          corporate defendants. One coherent number, one comparison, no double-
          counting deaths.
        </p>
        <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
          <span className="font-black text-foreground">Alternative pleadings.</span>{" "}
          If the Court rejects the lost-prosperity theory, body-count tiers
          fall back: floor{" "}
          <ParameterValue
            figures={3}
            param={CORPORATE_DAMAGES_STRICT_FLOOR_PER_CAPITA}
            valueOverride="$538K"
          />{" "}
          per capita; FCA treble{" "}
          <ParameterValue
            figures={3}
            param={CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA}
            valueOverride="$2.74M"
          />{" "}
          per capita. Each tier is independently citable.
        </p>
        <a
          className="mt-5 inline-block border-2 border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:bg-foreground hover:text-background"
          href={HUMANITY_V_GOVERNMENT_MANUAL_URL}
          rel="noreferrer"
          target="_blank"
        >
          Read the full damages analysis →
        </a>
      </section>

      <section className="mt-10 border-2 border-foreground bg-background p-5">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          File on behalf of the dead
        </h2>
        <p className="mt-2 text-base font-bold leading-7 text-foreground">
          A descendant or next-of-kin can file a wrongful-death claim on behalf
          of an estate. Each registered estate is another named plaintiff with
          its own $10.6M–$25.2M share. Four grandparents = four estates.
        </p>
        <Link
          className="mt-4 inline-block border-2 border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:bg-foreground hover:text-background"
          href={ROUTES.plaintiffs}
        >
          Register a deceased plaintiff
        </Link>
      </section>

    </main>
  );
}
