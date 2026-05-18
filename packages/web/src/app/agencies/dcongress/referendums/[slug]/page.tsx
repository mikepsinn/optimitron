import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { getReferendumStats } from "@/lib/verified-votes.server";
import { ReferendumVoteSection } from "@/components/referendum/ReferendumVoteSection";
import { readerMarkdownComponents } from "@/components/referendum/reader-markdown-components";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const referendum = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true, question: true, description: true },
  });

  if (!referendum) return { title: "Referendum Not Found" };

  return {
    title: `${referendum.title} | Optimitron`,
    description: referendum.description ?? referendum.question,
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

  const existingVote = user?.personId
    ? await prisma.referendumVote.findUnique({
        where: {
          referendumId_personId: {
            referendumId: referendum.id,
            personId: user.personId,
          },
        },
        select: { answer: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-3">
          Referendum
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
          {referendum.title}
        </h1>
        {referendum.description && (
          <p className="text-lg text-foreground leading-relaxed font-bold">
            {referendum.description}
          </p>
        )}
        <div className="mt-6 border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-foreground">
            Ballot Question
          </p>
          <p className="text-xl font-black leading-snug text-foreground">
            {referendum.question}
          </p>
        </div>
      </section>

      {referendum.bodyMarkdown && (
        <section className="mb-12 bg-[var(--treaty-paper)] text-[var(--treaty-ink)]">
          <div className="mx-auto max-w-2xl space-y-10">
            <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={readerMarkdownComponents}
            >
              {referendum.bodyMarkdown}
            </ReactMarkdown>
            <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
          </div>
        </section>
      )}

      {/* Vote tally */}
      <section className="mb-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="border-4 border-primary bg-green-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-green-700">
              {stats.yesVotes}
            </div>
            <div className="text-xs font-black uppercase text-green-700/60 mt-1">
              Yes
            </div>
          </div>
          <div className="border-4 border-primary bg-red-50 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-red-700">
              {stats.noVotes}
            </div>
            <div className="text-xs font-black uppercase text-red-700/60 mt-1">
              No
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-3xl font-black text-foreground">
              {stats.verifiedVotes}
            </div>
            <div className="text-xs font-black uppercase text-muted-foreground mt-1">
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
        username={user?.person?.handle ?? user?.referralCode ?? null}
      />
    </div>
  );
}
