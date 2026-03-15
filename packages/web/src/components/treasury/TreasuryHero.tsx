"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { moneyLink } from "@/lib/routes";

export function TreasuryHero() {
  return (
    <section className="mb-16">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-cyan">
          $WISH Treasury
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
          Every Transaction Funds What Works
        </h1>
        <p className="text-lg text-black/80 leading-relaxed font-medium">
          On my planet, the treasury runs itself. A 1% transaction tax on every
          $WISH transfer flows here automatically. Half goes to every verified
          citizen as UBI. The other half goes to politicians — proportional to
          how well their votes match what citizens actually want.
        </p>
        <p className="text-black/60 font-medium leading-relaxed">
          No IRS. No welfare bureaucracy. No campaign finance. Just a
          transparent algorithm doing in four lines of code what your species
          built seventeen federal agencies to not do.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <a
          href="#connect"
          className="inline-flex items-center justify-center border-4 border-black bg-brutal-cyan px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Connect & Register
        </a>
        <NavItemLink
          item={moneyLink}
          variant="custom"
          className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          How $WISH Works
        </NavItemLink>
      </div>
    </section>
  );
}
