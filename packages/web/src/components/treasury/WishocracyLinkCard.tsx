"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { wishocracyLink, prizeLink } from "@/lib/routes";

export function WishocracyLinkCard() {
  return (
    <section className="mb-16">
      <div className="border-y border-foreground/30 py-8 text-center">
        <h2 className="text-2xl font-black uppercase text-foreground mb-3">
          Two Systems. One Goal.
        </h2>
        <p className="text-foreground mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          This treasury handles UBI — every citizen gets an equal share of the
          transaction tax. Politicians are funded separately through Incentive
          Alignment Bonds, where 10% of treaty revenue funds aligned-politician
          Super PACs. Your Wishocracy preferences determine what
          &ldquo;aligned&rdquo; means for both systems.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Express Your Preferences
          </NavItemLink>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 border border-foreground bg-background px-6 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Buy Incentive Alignment Bonds
          </NavItemLink>
        </div>
      </div>
    </section>
  );
}
