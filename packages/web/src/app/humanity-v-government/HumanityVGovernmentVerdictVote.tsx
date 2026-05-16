"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type VerdictAnswer = "YES" | "NO" | "ABSTAIN";

interface HumanityVGovernmentVerdictVoteProps {
  existingAnswer: VerdictAnswer | null;
  fullDamagesLabel: string;
  question: string;
  referendumSlug: string;
}

const ANSWER_LABELS: Record<VerdictAnswer, string> = {
  YES: "Find for Humanity",
  NO: "Find for Governments",
  ABSTAIN: "Not sure",
};

function normalizeVerdictAnswer(value: string | null): VerdictAnswer | null {
  const upper = value?.toUpperCase();
  if (upper === "YES" || upper === "NO" || upper === "ABSTAIN") return upper;
  return null;
}

export function HumanityVGovernmentVerdictVote({
  existingAnswer,
  fullDamagesLabel,
  question,
  referendumSlug,
}: HumanityVGovernmentVerdictVoteProps) {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [answer, setAnswer] = useState<VerdictAnswer | null>(existingAnswer);
  const [pendingAuthAnswer, setPendingAuthAnswer] =
    useState<VerdictAnswer | null>(null);
  const [submittingAnswer, setSubmittingAnswer] =
    useState<VerdictAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoSubmitKeyRef = useRef<string | null>(null);

  const callbackUrl = useMemo(() => {
    const encoded = pendingAuthAnswer ? `?verdict=${pendingAuthAnswer}` : "";
    return `${ROUTES.humanityVGovernment}${encoded}`;
  }, [pendingAuthAnswer]);

  const castVote = useCallback(async (nextAnswer: VerdictAnswer) => {
    if (status !== "authenticated") {
      setPendingAuthAnswer(nextAnswer);
      return;
    }

    setSubmittingAnswer(nextAnswer);
    setError(null);

    try {
      const response = await fetch(`/api/referendums/${referendumSlug}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: nextAnswer,
          originUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to record verdict.");
      }

      setAnswer(nextAnswer);
      setPendingAuthAnswer(null);
    } catch (voteError) {
      setError(
        voteError instanceof Error
          ? voteError.message
          : "Failed to record verdict.",
      );
    } finally {
      setSubmittingAnswer(null);
    }
  }, [answer, referendumSlug, status]);

  useEffect(() => {
    const answerFromUrl = normalizeVerdictAnswer(searchParams.get("verdict"));
    if (!answerFromUrl || answer || status !== "authenticated") return;
    const key = `${referendumSlug}:${answerFromUrl}`;
    if (autoSubmitKeyRef.current === key) return;
    autoSubmitKeyRef.current = key;
    void castVote(answerFromUrl);
  }, [answer, castVote, referendumSlug, searchParams, status]);

  if (pendingAuthAnswer && status !== "authenticated") {
    return (
      <section className="border-2 border-foreground bg-background p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Finish your verdict
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
          {ANSWER_LABELS[pendingAuthAnswer]}
        </h2>
        <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
          Verify yourself so one human gets one verdict. Governments have
          enough duplicate paperwork already.
        </p>
        <div className="mt-5">
          <AuthForm
            callbackUrl={callbackUrl}
            compact
            emailButtonLabel="Email me a link to finish voting"
            emailPendingButtonLabel="Sending finish-voting link..."
            googleButtonLabel="Finish with Google"
            title="Finish voting"
            variant="document"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="border-2 border-foreground bg-background p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        Vote on the finding
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl">
        Should governments owe you full damages?
      </h2>
      <p className="mt-3 text-base font-bold leading-7 text-muted-foreground">
        {question}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
        The 1% Treaty is the cheap settlement offer. This vote records the
        bigger claim: governments owe the full damages demand, currently{" "}
        <span className="font-black text-foreground">{fullDamagesLabel}</span>{" "}
        per living human.
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-foreground">
        Voting no requires saying out loud: &ldquo;I believe my government
        should be allowed to kill my family with no consequences.&rdquo; Few
        ordinary humans want to say that sentence in public.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        {(["YES", "NO", "ABSTAIN"] as const).map((option) => {
          const isSelected = answer === option;
          const isSubmitting = submittingAnswer === option;
          return (
            <button
              key={option}
              className={cn(
                defaultButtonClassName,
                "px-4 tracking-[0.06em] disabled:opacity-50",
                isSelected && "bg-foreground text-background",
              )}
              disabled={Boolean(submittingAnswer)}
              onClick={() => void castVote(option)}
              type="button"
            >
              {isSubmitting ? "Recording..." : ANSWER_LABELS[option]}
            </button>
          );
        })}
      </div>

      {answer ? (
        <p className="mt-4 border-2 border-foreground bg-background px-3 py-2 text-sm font-black uppercase tracking-[0.08em] text-foreground">
          Verdict recorded: {ANSWER_LABELS[answer]}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 border-2 border-foreground bg-background px-3 py-2 text-sm font-black uppercase tracking-[0.08em] text-foreground">
          {error}
        </p>
      ) : null}
    </section>
  );
}
