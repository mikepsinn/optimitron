import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { getReferendumStats } from "@/lib/verified-votes.server";
import { ReferendumVoteSection } from "@/components/referendum/ReferendumVoteSection";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const referendum = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true, description: true },
  });

  if (!referendum) return { title: "Referendum Not Found" };

  return {
    title: `${referendum.title} | Optimitron`,
    description: referendum.description ?? `Vote on: ${referendum.title}`,
  };
}

export default async function ReferendumPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { ref } = await searchParams;

  const referendum = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
  });

  if (!referendum) notFound();

  const [stats, user] = await Promise.all([
    getReferendumStats(referendum.id),
    getCurrentUser(),
  ]);

  const existingVote = user
    ? await prisma.referendumVote.findUnique({
        where: {
          userId_referendumId: {
            userId: user.id,
            referendumId: referendum.id,
          },
        },
        select: { answer: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink mb-3">
          Referendum
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
          {referendum.title}
        </h1>
        {referendum.description && (
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            {referendum.description}
          </p>
        )}
      </section>

      {/* Vote tally */}
      <section className="mb-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="border-4 border-black bg-green-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-green-700">
              {stats.yesVotes}
            </div>
            <div className="text-xs font-black uppercase text-green-700/60 mt-1">
              Yes
            </div>
          </div>
          <div className="border-4 border-black bg-red-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-red-700">
              {stats.noVotes}
            </div>
            <div className="text-xs font-black uppercase text-red-700/60 mt-1">
              No
            </div>
          </div>
          <div className="border-4 border-black bg-brutal-cyan p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-black">
              {stats.verifiedVotes}
            </div>
            <div className="text-xs font-black uppercase text-black/60 mt-1">
              Verified
            </div>
          </div>
        </div>
      </section>

      {/* Voting + sharing */}
      <ReferendumVoteSection
        referendumSlug={slug}
        isActive={referendum.status === "ACTIVE"}
        isAuthenticated={!!user}
        existingAnswer={existingVote?.answer ?? null}
        referralCode={ref ?? null}
        userId={user?.id ?? null}
        username={user?.username ?? user?.referralCode ?? null}
      />
    </div>
  );
}
