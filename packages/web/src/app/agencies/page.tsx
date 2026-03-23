import type { Metadata } from "next";
import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { DEPRECATED_AGENCIES } from "@/lib/deprecated-agencies-data";

export const metadata: Metadata = {
  title: "Deprecated Agencies | Optimitron",
  description:
    "Government agencies replaced by smart contract functions. The bloated status quo vs the code that makes it obsolete.",
};

export default function AgenciesIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center gap-4">
            <span className="inline-block border-4 border-brutal-red bg-brutal-red px-4 py-1 text-sm font-black uppercase tracking-[0.15em] text-foreground -rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Deprecated
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
            Agencies We&apos;re Deprecating
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            Each of these agencies exists because your species didn&apos;t have
            smart contracts in the 20th century. Now you do. Here&apos;s the
            code that replaces them.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            On my planet, we deprecated our last government agency in year
            twelve. You lot seem to keep adding them. There are currently 440
            federal agencies. Most of them exist to manage the failures of other
            agencies.
          </p>
        </div>
      </section>

      {/* Total Savings Banner */}
      <section className="mb-16">
        <div className="border-4 border-primary bg-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
          <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div>
              <div className="text-4xl font-black text-brutal-pink sm:text-5xl">
                $1.37T
              </div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                Saved Per Year
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-brutal-cyan sm:text-5xl">
                $4,150
              </div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                Per Citizen Per Year
              </div>
            </div>
            <div>
              <div className="text-4xl font-black text-brutal-yellow sm:text-5xl">
                9
              </div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                Functions Replace Them All
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-sm font-bold italic leading-relaxed text-muted-foreground">
            &ldquo;You spend $1.37 trillion a year on agencies that could be
            replaced by nine functions and a blockchain. That&apos;s $4,150 per
            citizen per year in pure bureaucratic overhead. On my planet, we call
            that a memory leak.&rdquo;
          </p>
          <p className="mt-2 text-center text-xs font-black uppercase tracking-[0.1em] text-brutal-pink">
            — Wishonia
          </p>
        </div>
      </section>

      {/* Agency Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {DEPRECATED_AGENCIES.map((agency) => (
          <Link key={agency.id} href={agency.href} className="block">
            <BrutalCard
              bgColor={agency.cardColor === "green" ? "green" : agency.cardColor}
              hover
              padding="lg"
              className="h-full"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                  {agency.dName}
                </span>
                <span className="inline-block border-2 border-brutal-red bg-brutal-red px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-foreground -rotate-2">
                  Deprecated
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black uppercase text-foreground">
                {agency.agencyName}
              </h2>
              <p className="mt-3 text-sm font-bold italic leading-relaxed text-muted-foreground">
                &ldquo;{agency.tagline}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-black text-foreground">
                  {agency.annualSavings}
                </span>
                <span className="text-xs font-black uppercase text-muted-foreground">
                  saved/yr
                </span>
              </div>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
