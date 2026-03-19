import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Civic | Optimitron",
  description:
    "Vote on bills, track legislation, and discover how little your representatives agree with you.",
};

export default function CivicIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink mb-3">
          Civic Engagement
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
          Your Government, Audited
        </h1>
        <p className="text-lg text-foreground leading-relaxed font-bold max-w-2xl">
          Vote on actual legislation. Compare what your representatives
          say with what they do. Share the receipts.
        </p>
      </section>

      <div className="space-y-6">
        <Link
          href={ROUTES.wishonia}
          className="block border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-foreground mb-2">
            Vote on Bills
          </h2>
          <p className="text-sm font-bold text-foreground">
            I&apos;ll read the bills so you don&apos;t have to. Then I&apos;ll
            tell you what they actually cost. Then you vote.
          </p>
        </Link>

        <Link
          href={ROUTES.alignment}
          className="block border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-foreground mb-2">
            Alignment Scores
          </h2>
          <p className="text-sm font-bold text-foreground">
            Find out how often your representatives vote the way you&apos;d
            vote. Spoiler: less often than they claim.
          </p>
        </Link>

        <Link
          href={ROUTES.referendum}
          className="block border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-foreground mb-2">
            Referendums
          </h2>
          <p className="text-sm font-bold text-foreground">
            Vote on proposals. Get verified. Skip the middleman who was
            going to ignore you anyway.
          </p>
        </Link>
      </div>
    </div>
  );
}
