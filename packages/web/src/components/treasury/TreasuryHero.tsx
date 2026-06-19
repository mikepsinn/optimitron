"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { iabLink } from "@/lib/routes";

export function TreasuryHero() {
  return (
    <section className="mb-16">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
          Wishes Treasury
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          Every Transaction Funds Your UBI
        </h1>
        <p className="text-lg text-foreground leading-relaxed font-bold">
          On my planet, the treasury runs itself. A small transaction tax on
          every wish transfer flows here automatically. Then 100% of it gets
          split equally among every verified citizen. No IRS. No welfare
          bureaucracy. No applications. Just proof you exist.
        </p>
        <p className="text-muted-foreground font-bold leading-relaxed">
          Politician funding? That&apos;s handled by Incentive Alignment Bonds —
          outcome-gated, not transaction-gated. Politicians only get paid when
          the treaty produces results. This treasury is purely for citizens.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <NavItemLink
          item={iabLink}
          variant="custom"
          className="inline-flex items-center justify-center border border-foreground bg-background px-8 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Politician Funding (IABs)
        </NavItemLink>
      </div>
    </section>
  );
}
