import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Layout from "@/components/layout";
import { readerMarkdownComponents } from "@optimitron/site-kit/components/referendum/reader-markdown-components";
import { getSessionUserId } from "@/lib/auth-utils";
import { getPublicCourtVotingReferendum } from "@/lib/court-jury-voting.server";
import { prisma } from "@/lib/prisma";
import { JuryVote } from "./jury-vote";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ballot = await getPublicCourtVotingReferendum(slug);
  if (!ballot) return { title: "Ballot not found | Court of Humanity" };
  return {
    title: `${ballot.title} | Court of Humanity`,
    description: ballot.question,
    alternates: {
      canonical: `https://courtofhumanity.org/referendums/${encodeURIComponent(slug)}`,
    },
  };
}

export default async function JuryBallotPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const ballot = await getPublicCourtVotingReferendum(slug);
  if (!ballot) notFound();
  const userId = await getSessionUserId();
  const existingVote = userId
    ? await prisma.referendumVote.findFirst({
        where: { referendumId: ballot.id, userId, deletedAt: null },
        select: { answer: true },
      })
    : null;
  const { ref } = await searchParams;

  return (
    <Layout>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="mb-3 text-sm font-black uppercase tracking-widest">Jury ballot</p>
        <h1 className="mb-6 break-words text-3xl font-black sm:text-5xl">{ballot.title}</h1>
        {ballot.description && <p className="mb-8 whitespace-pre-wrap text-lg">{ballot.description}</p>}
        <h2 className="mb-6 text-xl font-bold">{ballot.question}</h2>
        {ballot.bodyMarkdown && (
          <article className="mb-10 space-y-8 bg-[var(--treaty-paper)] text-[var(--treaty-ink)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={readerMarkdownComponents}>
              {ballot.bodyMarkdown}
            </ReactMarkdown>
          </article>
        )}
        <JuryVote
          slug={slug}
          active={ballot.status === "ACTIVE"}
          existingAnswer={existingVote?.answer ?? null}
          referralCode={ref}
        />
      </main>
    </Layout>
  );
}
