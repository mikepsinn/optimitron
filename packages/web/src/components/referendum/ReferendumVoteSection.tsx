"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { WorldIdVerificationCard } from "@/components/personhood/WorldIdVerificationCard";
import { getSignInPath } from "@/lib/routes";
import { storage } from "@/lib/storage";
import { buildReferendumReferralUrl } from "@/lib/url";

interface ReferendumVoteSectionProps {
  referendumSlug: string;
  isActive: boolean;
  isAuthenticated: boolean;
  existingAnswer: string | null;
  referralCode: string | null;
  userId: string | null;
  username: string | null;
}

export function ReferendumVoteSection({
  referendumSlug,
  isActive,
  isAuthenticated,
  existingAnswer,
  referralCode,
  username,
}: ReferendumVoteSectionProps) {
  const [answer, setAnswer] = useState<string | null>(existingAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintQueued, setMintQueued] = useState(false);
  const { address } = useAccount();

  // Store referral code for attribution at signup and vote time
  if (typeof window !== "undefined" && referralCode) {
    storage.setSignupReferral(referralCode);
  }

  const castVote = async (position: "YES" | "NO") => {
    setIsSubmitting(true);
    setError(null);

    try {
      const storedRef =
        referralCode ?? storage.getSignupReferral();

      const res = await fetch(`/api/referendums/${referendumSlug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: position,
          ref: storedRef,
          walletAddress: address ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to cast vote");
      }

      const result = (await res.json()) as { voteTokenMint?: unknown };
      if (result.voteTokenMint) {
        setMintQueued(true);
      }

      setAnswer(position);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-sm font-black uppercase text-muted-foreground">
          This referendum is no longer accepting votes.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const signInHref = getSignInPath(`/referendum/${referendumSlug}`, {
      referralCode,
    });

    return (
      <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-foreground mb-2">
          Sign In to Vote
        </h3>
        <p className="text-sm font-bold text-foreground">
          You need an account to cast your vote. Verify with World ID
          afterwards to make it count as a verified vote.
        </p>
        <a
          href={signInHref}
          className="mt-4 inline-flex items-center justify-center border-4 border-primary bg-foreground px-6 py-2 text-sm font-black uppercase text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (answer) {
    const shareUrl = buildReferendumReferralUrl(referendumSlug, username);

    return (
      <div className="space-y-6">
        <div className="border-4 border-primary bg-green-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-2">
            Vote Recorded: {answer}
          </h3>
          <p className="text-sm font-bold text-foreground">
            Verify with World ID to make your vote count as verified.
            Then share your link below to bring in more verified votes.
          </p>
        </div>

        {/* VOTE point earning info */}
        {mintQueued ? (
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-foreground mb-2">
              1 VOTE Point Queued
            </h3>
            <p className="text-sm font-bold text-foreground">
              Your verified vote earned 1 VOTE point. It will be minted
              on-chain in the next batch.{" "}
              <Link
                href="/contribute"
                className="font-black text-brutal-pink underline hover:text-foreground"
              >
                View your VOTE balance &rarr;
              </Link>
            </p>
          </div>
        ) : (
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase text-foreground mb-2">
              Earn VOTE Points
            </h3>
            <p className="text-sm font-bold text-foreground">
              Verify with World ID below{address ? "" : " and connect a wallet"} to earn 1 VOTE point for this
              vote. VOTE points are redeemable for a share of the{" "}
              <Link
                href="/contribute"
                className="font-black text-brutal-pink underline hover:text-foreground"
              >
                Earth Optimization Prize
              </Link>{" "}
              if health and income outcomes improve.
            </p>
          </div>
        )}

        {/* World ID verification — only show if not yet verified */}
        <WorldIdVerificationCard show />

        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-3">
            Your Referral Link
          </h3>
          <p className="text-sm font-bold text-muted-foreground mb-4">
            Every verified vote through your link increases your share of the
            success pool. Share it everywhere.
          </p>
          <CopyLinkButton url={shareUrl} variant="landing" />
          <div className="mt-4 flex justify-center">
            <SocialShareButtons
              url={shareUrl}
              text="I voted on this referendum. Add your voice — every verified vote counts."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black uppercase text-foreground mb-4">
        Cast Your Vote
      </h3>
      {error && (
        <div className="mb-4 border-2 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => void castVote("YES")}
          disabled={isSubmitting}
          className="flex-1 border-4 border-primary bg-brutal-cyan py-4 text-xl font-black uppercase text-brutal-cyan-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
        >
          Yes
        </button>
        <button
          onClick={() => void castVote("NO")}
          disabled={isSubmitting}
          className="flex-1 border-4 border-primary bg-brutal-red py-4 text-xl font-black uppercase text-brutal-red-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
        >
          No
        </button>
      </div>
    </div>
  );
}
