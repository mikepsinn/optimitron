import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildCivicVoteUrl, getBaseUrl } from "@/lib/url";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";

interface CivicVotePageProps {
  params: Promise<{
    identifier: string;
  }>;
}

export async function generateMetadata({
  params,
}: CivicVotePageProps): Promise<Metadata> {
  const { identifier } = await params;
  const vote = await prisma.citizenBillVote.findUnique({
    where: { shareIdentifier: identifier },
  });

  if (!vote) {
    return { title: "Vote | Optimitron" };
  }

  return {
    title: `Vote on ${vote.billTitle} | Optimitron`,
    description: `A citizen voted ${vote.position} on ${vote.billTitle}. See their analysis.`,
  };
}

export default async function CivicVotePage({
  params,
}: CivicVotePageProps) {
  const { identifier } = await params;
  const vote = await prisma.citizenBillVote.findUnique({
    where: { shareIdentifier: identifier },
    include: { user: { select: { name: true, username: true } } },
  });

  if (!vote) {
    notFound();
  }

  const shareUrl = buildCivicVoteUrl(vote.shareIdentifier, getBaseUrl());
  const displayName = vote.user.username
    ? `@${vote.user.username}`
    : vote.user.name ?? "Anonymous citizen";

  interface CBASnapshot {
    structural?: { overallSignal?: string };
    llm?: { summary?: string };
  }
  const cba: CBASnapshot | null = vote.cbaSnapshot ? (() => {
    try { return JSON.parse(vote.cbaSnapshot) as CBASnapshot; } catch { return null; }
  })() : null;

  const positionColor =
    vote.position === "YES" ? "var(--brutal-cyan)" :
    vote.position === "NO" ? "var(--brutal-pink)" :
    "var(--brutal-yellow)";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="opto-card" style={{ padding: "2rem" }}>
        <h1 className="mb-2 text-2xl font-black uppercase">
          Citizen Vote
        </h1>
        <p className="mb-4 text-sm font-bold uppercase opacity-60">
          by {displayName}
        </p>

        <div className="mb-4">
          <span
            className="inline-block border-2 border-black px-3 py-1 text-lg font-black uppercase"
            style={{ background: positionColor }}
          >
            {vote.position}
          </span>
        </div>

        <h2 className="mb-2 text-lg font-bold">{vote.billTitle}</h2>
        <p className="mb-1 text-sm font-mono opacity-70">{vote.billId}</p>

        {vote.reasoning && (
          <div className="mt-4 border-l-4 border-black pl-4">
            <p className="text-sm font-bold uppercase opacity-60">Reasoning</p>
            <p className="mt-1">{vote.reasoning}</p>
          </div>
        )}

        {cba && (
          <div className="mt-4 border-t-2 border-black pt-4">
            <p className="text-sm font-bold uppercase opacity-60">Cost-Benefit Analysis</p>
            {cba.structural?.overallSignal && (
              <p className="mt-1 text-sm">
                Overall signal:{" "}
                <strong>{cba.structural.overallSignal}</strong>
              </p>
            )}
            {cba.llm?.summary && (
              <p className="mt-2 text-sm">{cba.llm.summary}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <CopyLinkButton url={shareUrl} />
          <SocialShareButtons
            url={shareUrl}
            text={`I voted ${vote.position} on "${vote.billTitle}" — see my analysis on Optimitron.`}
          />
        </div>

        <p className="mt-6 text-xs opacity-50">
          Voted on {vote.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
