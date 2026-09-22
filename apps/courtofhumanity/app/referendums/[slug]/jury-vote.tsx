"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { defaultButtonClassName } from "@/components/default-button";

type Answer = "YES" | "NO" | "ABSTAIN";

export function JuryVote({ slug, active, existingAnswer, referralCode }: {
  slug: string;
  active: boolean;
  existingAnswer: string | null;
  referralCode?: string;
}) {
  const { status } = useSession();
  const [answer, setAnswer] = useState(existingAnswer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = `/referendums/${encodeURIComponent(slug)}${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`;

  async function vote(nextAnswer: Answer) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/referendums/${encodeURIComponent(slug)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: nextAnswer, makePublic: false, ref: referralCode, originUrl: window.location.href }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Could not save your vote. Please try again.");
      }
      setAnswer(nextAnswer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your vote.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Cast your jury vote" className="space-y-5">
      {answer && <p role="status">Your vote: <strong>{answer}</strong>.</p>}
      {!active ? <p>This ballot is closed.</p> : status === "loading" ? <p>Loading sign-in…</p> : status !== "authenticated" ? (
        <AuthForm callbackUrl={callbackUrl} />
      ) : (
        <>
          <p>Your vote is private. You can change it while the ballot is open.</p>
          <div className="flex flex-wrap gap-4">
            {(["YES", "NO", "ABSTAIN"] as const).map((option) => (
              <button key={option} type="button" className={defaultButtonClassName} disabled={pending} aria-pressed={answer === option} onClick={() => void vote(option)}>
                {option === "ABSTAIN" ? "Abstain" : option === "YES" ? "Yes" : "No"}
              </button>
            ))}
          </div>
          {pending && <p role="status">Saving your vote…</p>}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
