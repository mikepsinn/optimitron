"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { wishocracyLink, prizeLink } from "@/lib/routes";

export function WishocracyLinkCard() {
  return (
    <section className="mb-16">
      <div className="border-4 border-primary bg-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-2xl font-black uppercase text-background mb-3">
          Two Systems. One Goal.
        </h2>
        <p className="text-background mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          This treasury handles UBI — every citizen gets an equal share of the
          transaction tax. Politicians are funded separately through Incentive
          Alignment Bonds, where 10% of treaty revenue flows to the political
          incentive layer. Your Wishocracy preferences determine what
          &ldquo;aligned&rdquo; means for both systems.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-background px-6 py-3 text-sm font-black text-foreground uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Express Your Preferences
          </NavItemLink>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-black text-background uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Buy Incentive Alignment Bonds
          </NavItemLink>
        </div>
      </div>
    </section>
  );
}
