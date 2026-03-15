"use client";

import { NavItemLink } from "@/components/navigation/NavItemLink";
import { wishocracyLink, alignmentLink } from "@/lib/routes";

export function WishocracyLinkCard() {
  return (
    <section className="mb-16">
      <div className="border-4 border-black bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-2xl font-black uppercase text-white mb-3">
          Your Preferences Shape the Allocation
        </h2>
        <p className="text-white/80 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The alignment pool funds politicians proportional to how well their
          votes match citizen preferences. Your pairwise comparisons in the
          Wishocracy determine what &ldquo;aligned&rdquo; means. More
          comparisons = more stable weights = better allocation.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Express Your Preferences
          </NavItemLink>
          <NavItemLink
            item={alignmentLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Score Your Politicians
          </NavItemLink>
        </div>
      </div>
    </section>
  );
}
