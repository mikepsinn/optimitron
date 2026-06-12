"use client";

import React from "react";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { obgLink, federalReserveLink, wishocracyLink } from "@/lib/routes";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  fmtRaw,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  WAR_DEATHS_SINCE_1900,
  ECONOMIC_MULTIPLIER_MILITARY_SPENDING,
  ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT,
  GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL,
} from "@optimitron/data/parameters";
const milSpend = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value;
const milMultiplier = ECONOMIC_MULTIPLIER_MILITARY_SPENDING.value;
const healthMultiplier = ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT.value;
const totalAlt = 150e9 + 20e9 + GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL.value + 45e9;

const couldHaveBought: { instead: string; price: React.ReactNode; ratio: string }[] = [
  {
    instead: "Clean water for every human on Earth",
    price: "$150 billion (one-time)",
    ratio: `${((150e9 / milSpend) * 100).toFixed(1)}% of one year's military budget. You could do it in a weekend.`,
  },
  {
    instead: "End global homelessness",
    price: "$20 billion/yr",
    ratio: `${((20e9 / milSpend) * 100).toFixed(1)}% of what you spend on war. A rounding error.`,
  },
  {
    instead: "Fund all global clinical trials",
    price: (<><ParameterValue param={GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL} display="withUnit" figures={3} />/yr</>),
    ratio: `${((GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL.value / milSpend) * 100).toFixed(1)}% of military spending. You spend more on military bands.`,
  },
  {
    instead: "Universal basic nutrition",
    price: "$45 billion/yr",
    ratio: `${((45e9 / milSpend) * 100).toFixed(1)}%. Less than the Pentagon loses track of in accounting errors annually.`,
  },
];

export default function DepartmentOfWarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
            Department of War
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
            We Don&apos;t Have One
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            Because war is fucking stupid.
          </p>
          <p className="font-bold leading-relaxed text-muted-foreground">
            I realise that&apos;s not the kind of language you expect from a
            governance platform. But I&apos;ve been running a civilisation for
            4,237 years, and after modelling every possible resource-allocation
            strategy, the one where you spend{" "}
            <ParameterValue param={{...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"}} display="withUnit" />{" "}
            per year on exploding each other consistently ranks last. Dead last.
            Below &ldquo;doing literally nothing.&rdquo;
          </p>
        </div>
      </section>

      {/* The Numbers */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          The Numbers
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          I don&apos;t have opinions about war. I have a spreadsheet. The
          spreadsheet is very clear.
        </p>
        <div className="space-y-4">
          {/* Military spending */}
          <div className="border border-foreground/30 bg-background p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="text-sm font-black uppercase text-muted-foreground">
                Global military spending (2024)
              </div>
              <div className="text-2xl font-black text-foreground">
                <ParameterValue param={{...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"}} display="withUnit" />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Per year. Every year. Exposed to weather.
            </p>
          </div>

          {/* War deaths */}
          <div className="border border-foreground/30 bg-background p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="text-sm font-black uppercase text-muted-foreground">
                War and conflict deaths since 1900
              </div>
              <div className="text-2xl font-black text-foreground">
                <ParameterValue param={WAR_DEATHS_SINCE_1900} />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {WAR_DEATHS_SINCE_1900.description}
            </p>
          </div>

          {/* Cumulative military spending */}
          <div className="border border-foreground/30 bg-background p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="text-sm font-black uppercase text-muted-foreground">
                Cumulative military spending (since 1913)
              </div>
              <div className="text-2xl font-black text-foreground">
                <ParameterValue param={{...CUMULATIVE_MILITARY_SPENDING_FED_ERA, unit: "USD"}} display="withUnit" />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Adjusted for inflation. Enough to have cured every major disease
              several times over.
            </p>
          </div>

          {/* Economic multiplier */}
          <div className="border border-foreground/30 bg-background p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div className="text-sm font-black uppercase text-muted-foreground">
                Military spending ROI
              </div>
              <div className="text-2xl font-black text-foreground">
                <ParameterValue param={ECONOMIC_MULTIPLIER_MILITARY_SPENDING} />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              Every dollar on military generates{" "}
              <ParameterValue param={ECONOMIC_MULTIPLIER_MILITARY_SPENDING} /> in economic
              output. Healthcare generates{" "}
              <ParameterValue param={ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT} />. You are
              choosing the worse investment by a factor of{" "}
              {Math.round(healthMultiplier / milMultiplier)}.
            </p>
          </div>
        </div>
      </section>

      {/* What It Could Have Bought */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          What That Money Could Buy Instead
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Every year, your species takes{" "}
          <ParameterValue param={{...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"}} display="withUnit" />{" "}
          — the accumulated productive output of hundreds of millions of
          workers — and converts it into things designed to destroy other things.
          Here is a partial list of what you could do with it if you simply...
          stopped.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {couldHaveBought.map((item) => (
            <div
              key={item.instead}
              className="border border-foreground/30 bg-background p-6 text-foreground"
            >
              <h3 className="text-sm font-black uppercase">
                {item.instead}
              </h3>
              <div className="mt-2 text-2xl font-black text-foreground">
                {item.price}
              </div>
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                {item.ratio}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-l border-foreground/30 pl-4">
          <p className="text-sm font-bold leading-relaxed">
            Clean water, no homelessness, fully funded medical research, and no
            one starving. Total cost: roughly ${fmtRaw(totalAlt)} per year.
            That&apos;s {((totalAlt / milSpend) * 100).toFixed(0)}% of current
            military spending. You could solve all four and still have $
            {fmtRaw(milSpend - totalAlt)} left over for — I don&apos;t know —
            literally anything else.
          </p>
        </div>
      </section>

      {/* On My Planet */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          How We Handle Conflict on My Planet
        </h2>
        <div className="border-y border-foreground/30 py-8 text-foreground">
          <p className="text-lg font-black leading-relaxed">
            We ended war in year twelve.
          </p>
          <p className="mt-4 font-bold leading-relaxed">
            Not through pacifism or moral awakening or a particularly moving
            speech. We just ran the numbers. War is a negative-sum game — every
            participant ends up with less than they started with, including the
            &ldquo;winner.&rdquo; Once we published the cost-benefit analysis,
            continuing to wage war became roughly as popular as volunteering to
            set your own house on fire.
          </p>
          <p className="mt-4 font-bold leading-relaxed opacity-80">
            Disputes still happen. We resolve them with data, binding
            arbitration, and an optimisation function that finds the allocation
            where both parties are measurably better off. It takes about six
            minutes. Nobody dies. There is no marching.
          </p>
        </div>
      </section>

      {/* The Rebranding */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          &ldquo;Defence&rdquo;
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          In 1947, the United States renamed its Department of War to the
          Department of Defense. The wars did not become more defensive. They
          just sounded nicer. Since the rebrand: Korea, Vietnam, Grenada, Panama,
          Gulf War, Somalia, Bosnia, Kosovo, Afghanistan, Iraq, Libya, Syria,
          Yemen. That is a lot of defending.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="border border-foreground/30 bg-background p-6 text-foreground">
            <div className="text-3xl font-black">13+</div>
            <div className="mt-1 text-xs font-black uppercase">
              Wars Since &ldquo;Defense&rdquo; Rebrand
            </div>
          </div>
          <div className="border border-foreground/30 bg-background p-6 text-foreground">
            <div className="text-3xl font-black">0</div>
            <div className="mt-1 text-xs font-black uppercase">
              Were Defensive
            </div>
          </div>
          <div className="border border-foreground/30 bg-background p-6">
            <div className="text-3xl font-black text-foreground">1947</div>
            <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
              When Branding Replaced Honesty
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-foreground/30 py-8 text-center">
        <h2 className="mb-3 text-2xl font-black uppercase">
          Optimise for Living, Not Killing
        </h2>
        <p className="mx-auto mb-6 max-w-2xl font-bold leading-relaxed">
          On this platform, we allocate resources toward things that make
          people&apos;s lives measurably better. Disease reduction. Income
          growth. Healthy life years. We have no Department of War because we
          have a spreadsheet, and the spreadsheet says war is — and I want to be
          precise here — fucking stupid.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={obgLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
          >
            See the Optimal Budget
          </NavItemLink>
          <NavItemLink
            item={federalReserveLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Stop Printing War Money
          </NavItemLink>
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Set Your Priorities
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
