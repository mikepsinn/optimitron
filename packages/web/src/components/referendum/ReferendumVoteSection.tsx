"use client";

import { useState } from "react";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { SocialShareButtons } from "@/components/sharing/social-share-buttons";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { getSignInPath, ROUTES } from "@/lib/routes";
import { storage } from "@/lib/storage";
import { buildReferendumReferralUrl } from "@/lib/url";
import { defaultButtonClassName } from "@/components/ui/default-button";

interface ReferendumVoteSectionProps {
  referendumSlug: string;
  isActive: boolean;
  isAuthenticated: boolean;
  existingAnswer: string | null;
  referralCode: string | null;
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
  const { showWishReward } = useWishPoints();

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
          originUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to cast vote");
      }

      const result = (await res.json()) as { wishesEarned?: number };

      if (result.wishesEarned) {
        try { showWishReward(result.wishesEarned, "Referendum Vote"); } catch { /* noop */ }
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
    const signInHref = getSignInPath(`${ROUTES.referendum}/${referendumSlug}`, {
      referralCode,
    });

    return (
      <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase text-foreground mb-2">
          Cast Your Vote
        </h3>
        <p className="text-sm font-bold text-foreground">
          You need an account so one human gets one vote. Continue, vote, then
          hire two more Humanity Managers.
        </p>
        <a
          href={signInHref}
          className={`${defaultButtonClassName} mt-4 min-h-10 px-6 py-2`}
        >
          Continue
        </a>
      </div>
    );
  }

  if (answer) {
    const shareUrl = buildReferendumReferralUrl(referendumSlug, username);

    return (
      <div className="space-y-6">
        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-2">
            Vote Recorded: {answer}
          </h3>
          <p className="text-sm font-bold text-foreground">
            Good. Now share your link below and bring in more humans.
          </p>
        </div>

        <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-3">
            Your Referral Link
          </h3>
          <p className="text-sm font-bold text-muted-foreground mb-4">
            Every voter through your link increases your share of the success
            pool. Share it everywhere.
          </p>
          <CopyLinkButton url={shareUrl} variant="landing" />
          <div className="mt-4 flex justify-center">
            <SocialShareButtons
              url={shareUrl}
              text="I voted on this referendum. Add your voice."
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
        <div className="mb-4 border-2 border-brutal-red bg-brutal-red p-3 text-sm font-bold text-brutal-red-foreground">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => void castVote("YES")}
          disabled={isSubmitting}
          className={`${defaultButtonClassName} flex-1 py-4 text-xl disabled:opacity-50`}
        >
          Yes
        </button>
        <button
          onClick={() => void castVote("NO")}
          disabled={isSubmitting}
          className={`${defaultButtonClassName} flex-1 py-4 text-xl disabled:opacity-50`}
        >
          No
        </button>
      </div>
    </div>
  );
}
