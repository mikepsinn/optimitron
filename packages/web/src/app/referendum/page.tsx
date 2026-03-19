import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Referendums | Optimitron",
  description:
    "Active referendums. Vote on proposals. Prove you're human. Get credit for caring.",
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
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
          Active Referendums
        </h1>
        <p className="text-lg text-foreground leading-relaxed font-bold max-w-2xl">
          Vote. Prove you&apos;re real. Share the link. Every verified human
          moves the needle. Bots need not apply.
        </p>
      </section>

      {referendums.length === 0 ? (
        <div className="border-4 border-primary bg-brutal-yellow p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <p className="text-lg font-black uppercase text-foreground">
            No active referendums right now.
          </p>
          <p className="text-sm font-bold text-muted-foreground mt-2">
            Check back. I&apos;m working on it. Running a planet takes time, even for me.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {referendums.map((referendum) => (
            <Link
              key={referendum.id}
              href={`/referendum/${referendum.slug}`}
              className="block border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-black uppercase text-foreground mb-2">
                    {referendum.title}
                  </h2>
                  {referendum.description && (
                    <p className="text-sm font-bold text-foreground line-clamp-2">
                      {referendum.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 border-4 border-primary bg-brutal-cyan px-4 py-2 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-2xl font-black text-foreground">
                    {referendum._count.votes}
                  </div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground">
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
