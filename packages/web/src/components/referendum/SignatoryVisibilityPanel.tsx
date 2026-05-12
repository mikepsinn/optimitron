"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicSignatoryUserStatus } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";

interface SignatoryVisibilityPanelProps {
  status: PublicSignatoryUserStatus;
}

export function SignatoryVisibilityPanel({
  status,
}: SignatoryVisibilityPanelProps) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(status.isPublic);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const listed = status.hasYesVote && isPublic && status.listed;
  const statusText = getStatusText({
    hasYesVote: status.hasYesVote,
    isPublic,
    listed,
    rank: status.rank,
  });

  async function updateVisibility(nextIsPublic: boolean) {
    setError(null);
    setIsSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
    } catch {
      setIsSaving(false);
      setError("Profile visibility did not update. Try again.");
      return;
    }

    if (!response.ok) {
      setIsSaving(false);
      setError("Profile visibility did not update. Try again.");
      return;
    }

    setIsPublic(nextIsPublic);
    setIsSaving(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="mb-6 border-2 border-foreground bg-background p-4 text-left text-foreground sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Your listing
          </p>
          <p className="mt-1 text-base font-black text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-lg">
            {statusText}
          </p>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            Public YES votes appear here immediately. Recruiting voters moves
            you up.
          </p>
          {status.hasYesVote ? (
            <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              {status.referredYesCount.toLocaleString()} voters recruited
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm font-bold text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            aria-pressed={isPublic}
            className="border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving || isPending}
            onClick={() => void updateVisibility(!isPublic)}
            type="button"
          >
            {isPublic ? "Make Private" : "Make Public"}
          </button>
          {!status.hasYesVote ? (
            <Link
              className="border-2 border-foreground bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              href={ROUTES.vote}
            >
              Sign Treaty
            </Link>
          ) : null}
          <Link
            className="border-2 border-foreground bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            href={ROUTES.profile}
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

function getStatusText(input: {
  hasYesVote: boolean;
  isPublic: boolean;
  listed: boolean;
  rank: number | null;
}) {
  if (!input.hasYesVote) {
    return input.isPublic
      ? "Your profile is public. Sign the treaty to appear here."
      : "Sign the treaty, then make your profile public to appear here.";
  }

  if (!input.isPublic) {
    return "Your YES vote counts. Your name is private.";
  }

  if (!input.listed) {
    return "Your profile is public. Your YES vote is waiting for the list.";
  }

  return input.rank ? `You are public at #${input.rank}.` : "You are public.";
}
