import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Civic | Optimitron",
  description:
    "Civic engagement tools — vote on bills, track legislation, and hold representatives accountable.",
};

export default function CivicIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink mb-3">
          Civic Engagement
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
          Your Government, Your Data
        </h1>
        <p className="text-lg text-black/80 leading-relaxed font-medium max-w-2xl">
          Vote on real legislation, compare your positions with your
          representatives, and share your civic record.
        </p>
      </section>

      <div className="space-y-6">
        <Link
          href={ROUTES.wishonia}
          className="block border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-black mb-2">
            Vote on Bills
          </h2>
          <p className="text-sm font-medium text-black/70">
            Chat with Wishonia to review current legislation, get a
            cost-benefit analysis, and cast your citizen vote.
          </p>
        </Link>

        <Link
          href={ROUTES.alignment}
          className="block border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-black mb-2">
            Alignment Scores
          </h2>
          <p className="text-sm font-medium text-black/70">
            See how your representatives&apos; voting records compare to what
            citizens actually want.
          </p>
        </Link>

        <Link
          href={ROUTES.referendum}
          className="block border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-xl font-black uppercase text-black mb-2">
            Referendums
          </h2>
          <p className="text-sm font-medium text-black/70">
            Vote on policy proposals directly and earn verified-vote rewards.
          </p>
        </Link>
      </div>
    </div>
  );
}
