"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { iabLink } from "@/lib/routes";

export function TreasuryHero() {
  return (
    <section className="mb-16">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-cyan">
          $WISH Treasury
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
          Every Transaction Funds Your UBI
        </h1>
        <p className="text-lg text-black/80 leading-relaxed font-medium">
          On my planet, the treasury runs itself. A small transaction tax on
          every $WISH transfer flows here automatically. Then 100% of it gets
          split equally among every verified citizen. No IRS. No welfare
          bureaucracy. No applications. Just proof you exist.
        </p>
        <p className="text-black/60 font-medium leading-relaxed">
          Politician funding? That&apos;s handled by Incentive Alignment Bonds
          — outcome-gated, not transaction-gated. Politicians only get paid when
          the treaty produces results. This treasury is purely for citizens.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <a
          href="#connect"
          className="inline-flex items-center justify-center border-4 border-black bg-brutal-cyan px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Register for UBI
        </a>
        <NavItemLink
          item={iabLink}
          variant="custom"
          className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Politician Funding (IABs)
        </NavItemLink>
      </div>
    </section>
  );
}
