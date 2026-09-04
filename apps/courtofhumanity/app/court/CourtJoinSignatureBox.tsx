"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import { primaryButtonClassName } from "@/components/default-button";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import {
  getPendingCourtVote,
  removePendingCourtVote,
  setPendingCourtVote,
} from "@/lib/court-pending-vote";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { getBaseUrl } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Name-signature box for /court, ported from the monolith's
 * `TreatyNameSignatureBox` with the Court of Humanity referendum config
 * inlined (this app serves exactly one joinable referendum).
 *
 * Submission semantics:
 *   - Signed-in: POST the YES vote (with the typed name) directly.
 *   - Signed-out: stash the pending YES vote in localStorage, then render
 *     the AuthForm so the visitor finishes joining via email. The pending
 *     vote syncs automatically on the next authenticated visit.
 */

const SIGNED_TITLE = "You are a member of the Court of Humanity.";
const SIGNED_BODY =
  "Share your link with anyone who should be able to inspect the cases and cast a verified verdict.";

async function postCourtVote(input: {
  displayName?: string;
  makePublic: boolean;
  referredBy: string | null;
}): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/referendums/${COURT_OF_HUMANITY_SLUG}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "YES",
          displayName: input.displayName || undefined,
          ref: input.referredBy ?? undefined,
          makePublic: input.makePublic,
          originUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export function CourtJoinSignatureBox({
  referralCode,
}: {
  referralCode?: string | null;
}) {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [makePublic, setMakePublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Server-recorded membership for the session user: undefined = still
   *  checking, null = none, object = already joined (fresh page loads,
   *  e.g. returning from the email sign-in link). */
  const [existingVote, setExistingVote] = useState<
    { displayName: string | null; signedOn: string } | null | undefined
  >(undefined);

  // Hydration-safe date stamp, marked volatile for screenshot review.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  // Returning from the email sign-in link: sync the staged join first so
  // the membership check below sees it.
  const syncedRef = useRef(false);
  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setExistingVote(null);
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;

    let cancelled = false;
    void (async () => {
      const pending = getPendingCourtVote();
      if (pending?.answer === "YES") {
        const synced = await postCourtVote({
          displayName: pending.displayName,
          makePublic: pending.makePublic ?? true,
          referredBy: pending.referredBy,
        });
        if (synced) removePendingCourtVote();
      }
      try {
        const res = await fetch(
          `/api/referendums/${COURT_OF_HUMANITY_SLUG}/vote`,
        );
        const data = res.ok
          ? ((await res.json()) as {
              vote: {
                answer: string;
                createdAt: string;
                displayName: string | null;
              } | null;
            })
          : null;
        if (cancelled) return;
        if (data?.vote && data.vote.answer === "YES") {
          setExistingVote({
            displayName: data.vote.displayName,
            signedOn: new Date(data.vote.createdAt).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" },
            ),
          });
        } else {
          setExistingVote(null);
        }
      } catch {
        if (!cancelled) setExistingVote(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const referralUrl = useMemo(() => {
    const identifier = getHandleOrReferralCode(session?.user);
    const base = `${getBaseUrl()}${ROUTES.court}`;
    return identifier ? `${base}?ref=${encodeURIComponent(identifier)}` : base;
  }, [session?.user]);

  function stagePendingSignature() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name to sign.");
      return false;
    }
    setPendingCourtVote({
      answer: "YES",
      displayName: trimmed,
      makePublic,
      referredBy: referralCode ?? null,
      timestamp: new Date().toISOString(),
    });
    setError(null);
    return true;
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);

    if (status === "authenticated") {
      const ok = await postCourtVote({
        displayName: trimmed,
        makePublic,
        referredBy: referralCode ?? null,
      });
      if (!ok) {
        setError("Failed to record your membership. Try again.");
        setSubmitting(false);
        return;
      }
    } else if (!stagePendingSignature()) {
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSigned(true);
  }

  if ((signed || existingVote) && status === "authenticated") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-2 text-center text-2xl font-black uppercase text-foreground">
          {SIGNED_TITLE}
        </p>
        {existingVote && !signed ? (
          <p className="mb-4 text-center text-base font-bold text-muted-foreground">
            {existingVote.displayName ?? "Recorded"}, {existingVote.signedOn}.
            One membership per human — yours is on the register.
          </p>
        ) : null}
        <p className="mb-5 text-center text-base font-bold leading-7 text-muted-foreground">
          {SIGNED_BODY}
        </p>
        <div className="mx-auto max-w-md">
          <p className="mb-2 break-all border-2 border-foreground bg-background px-3 py-2 text-center text-sm font-bold text-foreground">
            {referralUrl}
          </p>
          <CopyLinkButton link={referralUrl} variant="landing" />
        </div>
      </div>
    );
  }

  // Ordered before the loading placeholder on purpose. useSession returns to
  // "loading" whenever the session refetches -- window focus is the default
  // trigger -- and this form's whole job is to tell a signed-out visitor to go
  // and check their email. Leaving the placeholder first meant that tabbing to
  // the inbox and back replaced those instructions with an empty box, stranding
  // them mid-signature until a reload.
  if (signed) {
    return (
      <div className="mx-auto w-full max-w-md">
        <AuthForm
          callbackUrl={ROUTES.court}
          compact
          emailOnly
          showNameField={false}
          showSubscribe={false}
          emailButtonLabel="Email Me a Link to Finish Joining"
          emailLoadingLabel="Sending Finish-Joining Link..."
        />
      </div>
    );
  }

  // Session still resolving, or authenticated but the already-joined
  // check hasn't answered yet: don't flash a signature box at someone
  // who may have joined.
  if (
    status === "loading" ||
    (status === "authenticated" && existingVote === undefined)
  ) {
    return <div className="mx-auto w-full max-w-md" />;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-6 text-center text-xl font-bold text-foreground">
        Add your name to the membership record. Today is{" "}
        <span data-volatile="signature date">{today ?? ""}</span>.
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
          className={cn(
            primaryButtonClassName,
            "px-8 text-lg disabled:opacity-40",
          )}
        >
          {submitting ? "..." : "Join the Court"}
        </button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm font-bold text-foreground">
        <input
          type="checkbox"
          checked={makePublic}
          onChange={(e) => setMakePublic(e.target.checked)}
          className="mt-1 h-4 w-4 cursor-pointer accent-foreground"
        />
        <span>
          Display my name publicly on the Court membership list.
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
