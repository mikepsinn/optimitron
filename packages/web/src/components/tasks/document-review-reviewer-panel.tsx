"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { API_ROUTES } from "@/lib/api-routes";
import type { DocumentReviewPanelData } from "@/lib/tasks/document-review.server";

type ReviewerPanel = Extract<DocumentReviewPanelData, { mode: "REVIEWER" }>;
type Verdict = "APPROVE" | "CHANGES_REQUESTED" | "REJECT" | "ABSTAIN";

const fieldClassName =
  "w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";
const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const stateLabels: Record<ReviewerPanel["review"]["state"], string> = {
  ABSTAINED: "Abstained",
  APPROVED: "Approved",
  AWAITING_RESPONSE: "Awaiting your review",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  STALE: "Version changed",
};

const verdictLabels: Record<Verdict, string> = {
  ABSTAIN: "Abstained",
  APPROVE: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  REJECT: "Rejected",
};

async function expectOk(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Could not submit the review.");
  }
}

export function DocumentReviewReviewerPanel({
  panel,
}: {
  panel: ReviewerPanel;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busyVerdict, setBusyVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const { review } = panel;
  const isBusy = busyVerdict != null || isRefreshing;
  const isStale = review.state === "STALE";

  async function submit(verdict: Verdict) {
    if (isBusy) return;
    const explanation =
      verdict === "APPROVE"
        ? feedback.trim() || "Approved as written."
        : feedback.trim();
    if (!explanation) {
      setError("Explain your decision before submitting it.");
      return;
    }
    setError(null);
    setBusyVerdict(verdict);
    idempotencyKey.current ??= `document-review-response:${crypto.randomUUID()}`;
    try {
      const response = await fetch(
        API_ROUTES.tasks.documentReviewResponse(review.reviewTaskId),
        {
          body: JSON.stringify({ explanation, verdict }),
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey.current,
          },
          method: "POST",
        },
      );
      await expectOk(response);
      startRefresh(() => router.refresh());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the review.",
      );
    } finally {
      setBusyVerdict(null);
    }
  }

  return (
    <section
      aria-labelledby="document-review-heading"
      className="border-b border-foreground py-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" id="document-review-heading">
            {isStale ? "Past review" : "Review this version"}
          </h2>
        </div>
        {review.state === "AWAITING_RESPONSE" ? null : (
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">
            {stateLabels[review.state]}
          </span>
        )}
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {isStale
          ? "This review closed when a newer revision was created. Your pinned copy remains readable."
          : "Read the exact text below. Add questions or evidence in the discussion. Then record one decision for this version."}
      </p>

      <div className="mt-5 border border-foreground p-4">
        <h3 className="text-sm font-semibold">What to check</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {review.request.instructions}
        </p>
      </div>

      <div className="mt-6">
        <div>
          <h3 className="text-base font-semibold">{review.target.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Version {review.target.version} · exact text for this review
          </p>
        </div>
        <div className="mt-4 border-y border-foreground py-5">
          <RichMarkdown markdown={review.target.body} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-foreground p-4">
        <p className="text-sm text-muted-foreground">
          Votes help sort discussion; they do not approve the document.
        </p>
        <Link className={secondaryButtonClassName} href="#discussion">
          Open discussion
        </Link>
      </div>

      {review.response && !panel.canSubmit ? (
        <div className="mt-5 border border-foreground p-4">
          <h3 className="text-sm font-semibold">Your decision</h3>
          <p className="mt-2 text-base font-semibold">
            {verdictLabels[review.response.verdict]}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {review.response.explanation}
          </p>
        </div>
      ) : panel.canSubmit && !isStale ? (
        <div className="mt-6" id="review-decision">
          <h3 className="text-base font-semibold">Your decision</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Approval can be one click. Add a note if useful. Other decisions
            require an explanation.
          </p>
          <label className="mt-4 block space-y-1">
            <span className="text-sm font-semibold">Feedback</span>
            <textarea
              className={fieldClassName}
              onChange={(event) => {
                setFeedback(event.target.value);
                setError(null);
              }}
              placeholder="What is right, what should change, or why you cannot decide"
              rows={4}
              value={feedback}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className={primaryButtonClassName}
              disabled={isBusy}
              onClick={() => void submit("APPROVE")}
              type="button"
            >
              {busyVerdict === "APPROVE" ? "Submitting…" : "Approve"}
            </button>
            <button
              className={secondaryButtonClassName}
              disabled={isBusy}
              onClick={() => void submit("CHANGES_REQUESTED")}
              type="button"
            >
              {busyVerdict === "CHANGES_REQUESTED"
                ? "Submitting…"
                : "Request changes"}
            </button>
            <details className="relative">
              <summary className={`${secondaryButtonClassName} cursor-pointer`}>
                Other decision
              </summary>
              <div className="absolute right-0 z-10 mt-1 flex min-w-44 flex-col border border-foreground bg-background p-2">
                <button
                  className={secondaryButtonClassName}
                  disabled={isBusy}
                  onClick={() => void submit("REJECT")}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className={`${secondaryButtonClassName} mt-2`}
                  disabled={isBusy}
                  onClick={() => void submit("ABSTAIN")}
                  type="button"
                >
                  Abstain
                </button>
              </div>
            </details>
          </div>
          {error ? (
            <p
              className="mt-3 border border-foreground p-3 text-sm"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <details className="mt-5 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">
          Integrity details
        </summary>
        <dl className="mt-2 grid gap-1 break-all">
          <div>
            <dt className="inline font-semibold">Revision: </dt>
            <dd className="inline">{review.target.revisionId}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Content hash: </dt>
            <dd className="inline">{review.target.contentHash}</dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
