"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DashboardShareCard } from "@/components/dashboard/DashboardShareCard";
import { storage } from "@/lib/storage";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildUserReferralUrl } from "@/lib/url";
import { useHydratedNow } from "@/lib/use-hydrated-now";
import { cn } from "@/lib/utils";
import { primaryButtonClassName } from "@/components/ui/default-button";

/**
 * Document-style signature box for `/treaty` — the original UX from the
 * `7249ab82` era: a name field, a Sign button, and a date-stamped
 * "Signed this day, [date], in the year of our ongoing confusion." title
 * stamped above it. Not the Yes/No referendum control surface (those
 * live elsewhere). Reading and signing a treaty is one motion.
 *
 * Submission semantics:
 *   - Logged-in: POST the YES vote directly.
 *   - Logged-out: stash the pending YES vote in storage and render the
 *     AuthForm inline so the user finishes signing via email/Google.
 *     The pending vote gets cleared automatically on the next session
 *     by `treatyConfig.syncPending` (in `config/referendums.ts`).
 *
 * The typed name itself isn't sent over the wire — the API records the
 * authenticated user as the signer. The field is there because signing
 * a document is a "type your name" gesture, not a "click Yes" gesture.
 */
export function TreatyNameSignatureBox({
  className,
}: {
  className?: string;
}) {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [makePublic, setMakePublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useHydratedNow();

  const referralUrl = useMemo(
    () => buildUserReferralUrl(session?.user),
    [session?.user],
  );

  const today = now?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);

    const referralCode = storage.getSignupReferral();

    if (status === "authenticated") {
      try {
        const response = await fetch(
          `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answer: "YES",
              ref: referralCode ?? undefined,
              makePublic,
              originUrl:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
            }),
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Failed to record signature.");
        }
      } catch (signError) {
        setError(
          signError instanceof Error
            ? signError.message
            : "Failed to sign. Try again.",
        );
        setSubmitting(false);
        return;
      }
    } else {
      // Persist the pending YES vote — `treatyConfig.syncPending` picks
      // this up on the next session and submits it.
      storage.setPendingTreatyVote({
        answer: "YES",
        referredBy: referralCode ?? null,
        inviteToken: null,
        timestamp: new Date().toISOString(),
        organizationId: null,
      });
    }

    setSubmitting(false);
    setSigned(true);
  }

  if (signed && status === "authenticated") {
    // Catch the user at peak commitment — right after signing — and put
    // the share kit in front of them inline. Reuses the same
    // `<DashboardShareCard>` that lives on /dashboard so the Humanity
    // Manager copy + apocalypse math + canonical share message stay in
    // exactly one place.
    return (
      <div className={cn("mx-auto w-full max-w-2xl", className)}>
        <p className="mb-6 text-center text-2xl font-black uppercase text-foreground">
          Signed. Thank you for ending war and disease.
        </p>
        <DashboardShareCard referralUrl={referralUrl} />
      </div>
    );
  }

  if (signed) {
    return (
      <div className={cn("mx-auto w-full max-w-md", className)}>
        <p className="mb-4 text-center text-xl font-black uppercase text-foreground">
          One more step.
        </p>
        <p className="mb-6 text-center text-sm font-bold text-muted-foreground">
          Verify your identity to record your signature.
        </p>
        <AuthForm callbackUrl="/treaty" compact />
      </div>
    );
  }

  const resolvedTitle = today
    ? `Signed this day, ${today}, in the year of our ongoing confusion.`
    : "";

  return (
    <div className={cn("mx-auto w-full max-w-md", className)}>
      <p className="mb-6 text-center text-xl font-bold text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
        {resolvedTitle}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Your name"
          className="flex-1 border-2 border-foreground bg-background px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/40"
          aria-label="Your name"
          autoComplete="name"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || submitting}
          className={cn(primaryButtonClassName, "px-8 text-lg disabled:opacity-40")}
        >
          {submitting ? "..." : "Sign"}
        </button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm font-bold text-[var(--treaty-ink)]">
        <input
          type="checkbox"
          checked={makePublic}
          onChange={(e) => setMakePublic(e.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer accent-foreground"
        />
        <span>
          Display my name publicly on the signer list and leaderboards{" "}
          <span className="opacity-70">(recommended)</span>.
        </span>
      </label>
      {error ? (
        <p className="mt-3 text-center text-xs font-bold uppercase text-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
