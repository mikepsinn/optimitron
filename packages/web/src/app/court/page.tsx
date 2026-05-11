import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA,
  DEMOCIDE_TOTAL_20TH_CENTURY,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { formatCount } from "@/lib/format-count";
import { getHumanityVGovernmentPlaintiffCount } from "@/lib/humanity-v-government-case.server";
import { getRouteMetadata } from "@/lib/metadata";
import { courtLink, humanityVGovernmentLink, ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(courtLink);
}

interface CourtPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Court of Humanity entry surface. Tight executive summary of the only case
 * currently being heard — `Humanity v. Governments of Earth` — with a single
 * CTA (render the verdict = sign the 1% Treaty). The detailed case lives on
 * `/humanity-v-government`.
 *
 * Preserves `?ref=` so referrers landing visitors here keep attribution
 * through the sign flow at `/vote`.
 */
export default async function CourtPage({ searchParams }: CourtPageProps) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : null;
  const voteHref = ref
    ? `${ROUTES.vote}?ref=${encodeURIComponent(ref)}`
    : ROUTES.vote;
  const caseHref = ref
    ? `${ROUTES.humanityVGovernment}?ref=${encodeURIComponent(ref)}`
    : ROUTES.humanityVGovernment;

  const plaintiffCount = await getHumanityVGovernmentPlaintiffCount();
  await headers(); // force dynamic render

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
        Court of Humanity
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-[1.05] text-foreground sm:text-6xl">
        Plaintiff = treaty signer = juror.
        <br />
        One action. Three roles.
      </h1>
      <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-muted-foreground sm:text-lg">
        The Court of Humanity hears one case: <em>Humanity v. Governments of
        Earth</em>. The verdict is the 1% Treaty. Rendering it makes you a
        named plaintiff and a juror.
      </p>

      <section className="mt-10 border-2 border-foreground bg-background p-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          You are summoned
        </p>
        <p className="mt-3 text-base font-bold leading-7 text-foreground">
          Juror{" "}
          <span className="tabular-nums" data-volatile="juror-number">
            #{formatCount(plaintiffCount + 1)}
          </span>
          . Your share of the demanded recovery:{" "}
          <span className="font-black">
            <ParameterValue
              figures={3}
              param={CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA}
              valueOverride="$10.6M"
            />{" "}
            (NPV)
          </span>{" "}
          — <span className="font-black">$25.2M (lifetime cohort)</span>.
        </p>
        <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
          The case binds governments only when four billion plaintiffs render
          it. Recruit two more jurors. The case is the chain.
        </p>
        <Link
          className="mt-6 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-background hover:bg-background hover:text-foreground"
          href={voteHref}
        >
          Render the verdict — sign the 1% Treaty
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
              Humanity (
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
            <dd className="text-foreground">
              193 Governments of Earth, collectively
            </dd>
          </div>
          <div className="flex gap-4 border-b border-foreground py-3">
            <dt className="w-32 shrink-0 text-muted-foreground">Charge</dt>
            <dd className="text-foreground">
              Three counts of negligent mass homicide.
            </dd>
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
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          <li className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Direct killing
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">
              <ParameterValue
                param={WAR_DEATHS_SINCE_1900}
                valueOverride="310M"
              />
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              War + conflict deaths since 1900.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Regulatory delay
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">
              <ParameterValue
                param={EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL}
                valueOverride="102M"
              />
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              Patients who died waiting 8.2 years for safe-but-unproven drugs.
            </p>
          </li>
          <li className="border-2 border-foreground bg-background p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Misallocation
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">
              <ParameterValue
                param={DEMOCIDE_TOTAL_20TH_CENTURY}
                valueOverride="262M"
              />
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
              20th-century democide. Resources spent on killing, not the
              150,000/day disease toll.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-10 border-t-2 border-foreground pt-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-foreground hover:text-muted-foreground"
          href={caseHref}
        >
          Read the full case → {humanityVGovernmentLink.label}
        </Link>
      </section>
    </main>
  );
}
