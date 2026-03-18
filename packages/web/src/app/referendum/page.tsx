import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Referendums | Optimitron",
  description:
    "Active referendums — vote on policy proposals and earn verified-vote rewards.",
};

export default async function ReferendumsIndexPage() {
  const referendums = await prisma.referendum.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      createdAt: true,
      _count: { select: { votes: { where: { deletedAt: null } } } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink mb-3">
          Direct Democracy
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
          Active Referendums
        </h1>
        <p className="text-lg text-black/80 leading-relaxed font-medium max-w-2xl">
          Vote on proposals, verify with World ID, and share your referral link.
          Every verified vote counts.
        </p>
      </section>

      {referendums.length === 0 ? (
        <div className="border-4 border-black bg-brutal-yellow p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="text-lg font-black uppercase text-black">
            No active referendums right now.
          </p>
          <p className="text-sm font-medium text-black/60 mt-2">
            Check back soon — new proposals are added regularly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {referendums.map((referendum) => (
            <Link
              key={referendum.id}
              href={`/referendum/${referendum.slug}`}
              className="block border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase text-black mb-2">
                    {referendum.title}
                  </h2>
                  {referendum.description && (
                    <p className="text-sm font-medium text-black/70 line-clamp-2">
                      {referendum.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 border-4 border-black bg-brutal-cyan px-4 py-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-black">
                    {referendum._count.votes}
                  </div>
                  <div className="text-[10px] font-black uppercase text-black/60">
                    Votes
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
