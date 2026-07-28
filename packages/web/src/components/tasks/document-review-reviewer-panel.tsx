"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, useTransition } from "react";
import { DocumentReviewAnnotatedDiff } from "@/components/documents/document-review-annotated-diff";
import { DocumentRevisionDiff } from "@/components/documents/document-revision-diff";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { IntegrityProof } from "@/components/ui/integrity-proof";
import { API_ROUTES } from "@/lib/api-routes";
import type { DocumentReviewPanelData } from "@/lib/tasks/document-review.server";

type ReviewerPanel = Extract<DocumentReviewPanelData, { mode: "REVIEWER" }>;
type ChecklistResult = "PASS" | "FAIL" | "NOT_APPLICABLE";
type Verdict = "APPROVE" | "CHANGES_REQUESTED" | "REJECT" | "ABSTAIN";

const fieldClassName =
  "w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";
const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60";

const verdictLabels: Record<Verdict, string> = {
  ABSTAIN: "Abstain",
  APPROVE: "Approve",
  CHANGES_REQUESTED: "Changes requested",
  REJECT: "Reject",
};

const submitLabels: Record<Verdict, string> = {
  ABSTAIN: "Submit abstention",
  APPROVE: "Submit approval",
  CHANGES_REQUESTED: "Submit request",
  REJECT: "Submit rejection",
};

const stateLabels: Record<ReviewerPanel["review"]["state"], string> = {
  ABSTAINED: "Abstained",
  APPROVED: "Approved",
  AWAITING_RESPONSE: "Awaiting your review",
  AWAITING_VERIFICATION: "Submitted; completion check pending",
  CHANGES_REQUESTED: "Changes requested",
  DELIVERY_REJECTED: "Marked incomplete",
  REJECTED: "Rejected",
  STALE: "Closed because the document changed",
};

async function readResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Could not submit the review.");
  }
}

function formatUtcDateTime(value: string) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

function explanationLabel(verdict: Verdict) {
  switch (verdict) {
    case "APPROVE":
      return "Optional note";
    case "CHANGES_REQUESTED":
      return "What should change? *";
    case "REJECT":
      return "Why should this version be rejected? *";
    case "ABSTAIN":
      return "Why are you abstaining? *";
  }
}

function explanationPlaceholder(verdict: Verdict) {
  switch (verdict) {
    case "APPROVE":
      return "Anything the decision maker should know?";
    case "CHANGES_REQUESTED":
      return "Summarize the changes needed. Put clause-level feedback in the discussion below.";
    case "REJECT":
      return "Explain why this version should not proceed.";
    case "ABSTAIN":
      return "Explain why you cannot give a substantive verdict.";
  }
}

export function DocumentReviewReviewerPanel({
  panel,
}: {
  panel: ReviewerPanel;
}) {
  const router = useRouter();
  const { review } = panel;
  const isStale = review.state === "STALE";
  const [answers, setAnswers] = useState<
    Record<string, { comment: string; result: ChecklistResult | "" }>
  >(() =>
    Object.fromEntries(
      review.request.checklist.map((item) => [
        item.id,
        { comment: "", result: "" },
      ]),
    ),
  );
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalBody, setProposalBody] = useState("");
  const [proposalTitle, setProposalTitle] = useState(review.target.title);
  const [postedChangeFeedback, setPostedChangeFeedback] = useState<
    string | null
  >(null);
  const [verdict, setVerdict] = useState<Verdict | "">("");
  const deferredProposalBody = useDeferredValue(proposalBody);
  const isWorking = isSubmitting || isRefreshing;

  function chooseVerdict(nextVerdict: Verdict) {
    setError(null);
    setVerdict(nextVerdict);
  }

  function checklistResponses(defaultResult?: ChecklistResult) {
    return review.request.checklist.flatMap((item) => {
      const answer = answers[item.id];
      const result =
        answer?.result || (item.required ? defaultResult : undefined);
      if (!result) return [];
      return [
        {
          ...(answer?.comment.trim() ? { comment: answer.comment.trim() } : {}),
          criterionId: item.id,
          result,
        },
      ];
    });
  }

  function validateDetailedDecision() {
    if (isEditingProposal && !proposalBody.trim()) {
      setError(
        "Proposed text cannot be empty. Discard it to submit without edits.",
      );
      return false;
    }
    if (isEditingProposal && !proposalTitle.trim()) {
      setError("A proposed revision needs a title.");
      return false;
    }
    return true;
  }

  async function postReviewResponse(input: {
    checklistDefault?: ChecklistResult;
    explanation: string;
    includeProposal?: boolean;
    verdict: Verdict;
  }) {
    const response = await fetch(
      API_ROUTES.tasks.documentReviewResponse(review.reviewTaskId),
      {
        body: JSON.stringify({
          checklistResponses: checklistResponses(input.checklistDefault),
          explanation: input.explanation,
          ...(input.includeProposal
            ? {
                proposal: {
                  body: proposalBody.trim(),
                  title: proposalTitle.trim(),
                },
              }
            : {}),
          verdict: input.verdict,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    await readResponse(response);
  }

  async function approveReview() {
    if (isWorking) return;
    setError(null);
    setVerdict("APPROVE");
    setIsSubmitting(true);
    try {
      await postReviewResponse({
        checklistDefault: "PASS",
        explanation: "Approved as written.",
        verdict: "APPROVE",
      });
      startRefresh(() => router.refresh());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDetailedDecision() {
    if (isWorking || !verdict || verdict === "APPROVE") return;
    setError(null);
    const normalizedExplanation = explanation.trim();
    if (!normalizedExplanation) {
      setError("Explain your decision.");
      return;
    }
    if (!validateDetailedDecision()) return;

    setIsSubmitting(true);
    try {
      if (
        verdict === "CHANGES_REQUESTED" &&
        postedChangeFeedback !== normalizedExplanation
      ) {
        const commentResponse = await fetch(
          API_ROUTES.tasks.comments(review.reviewTaskId),
          {
            body: JSON.stringify({ message: normalizedExplanation }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        );
        await readResponse(commentResponse);
        setPostedChangeFeedback(normalizedExplanation);
      }
      await postReviewResponse({
        explanation: normalizedExplanation,
        includeProposal: isEditingProposal,
        verdict,
      });
      startRefresh(() => router.refresh());
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="document-review-heading"
      className="border-b border-foreground py-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {review.required ? "Required review" : "Advisory review"}
          </p>
          <h2
            className="mt-2 text-xl font-semibold"
            id="document-review-heading"
          >
            {isStale ? "Past review" : "Review this version"}
          </h2>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em]">
          {stateLabels[review.state]}
        </p>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {isStale
          ? "This is the version you were asked to review. The document has since changed, so its decision is closed. You can still read and comment for context; use the discussion to ask for the current version."
          : "Your judgment tells the requester whether to use this text or revise it. If it looks right, approve it. If it needs work, leave comments and request changes. Nobody else can change your decision after you submit it."}
      </p>

      <div className="mt-5 border border-foreground p-4">
        <h3 className="text-sm font-semibold">
          {isStale ? "Original review request" : "What to review"}
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {review.request.instructions}
        </p>

        {review.request.checklist.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm">
            {review.request.checklist.map((item) => (
              <li key={item.id}>
                {item.criterion}
                {item.required ? " (required)" : ""}
              </li>
            ))}
          </ul>
        ) : null}

        {panel.canSubmit && review.request.checklist.length > 0 ? (
          <details
            className="mt-4 border-t border-foreground pt-3"
            onToggle={(event) => setCriteriaOpen(event.currentTarget.open)}
            open={criteriaOpen}
          >
            <summary className="cursor-pointer text-sm font-semibold">
              Record criterion details ({review.request.checklist.length})
            </summary>
            <div className="mt-4 space-y-5">
              {review.request.checklist.map((item) => {
                const answer = answers[item.id] ?? {
                  comment: "",
                  result: "",
                };
                return (
                  <fieldset className="space-y-2" key={item.id}>
                    <legend className="text-sm font-semibold">
                      {item.criterion}
                      {item.required ? " *" : ""}
                    </legend>
                    <select
                      aria-label={`Result for ${item.criterion}`}
                      className={fieldClassName}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [item.id]: {
                            ...answer,
                            result: event.target.value as ChecklistResult | "",
                          },
                        }))
                      }
                      required={item.required}
                      value={answer.result}
                    >
                      <option value="">Choose a result</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                      <option value="NOT_APPLICABLE">Not applicable</option>
                    </select>
                    <textarea
                      aria-label={`Comment for ${item.criterion}`}
                      className={fieldClassName}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [item.id]: { ...answer, comment: event.target.value },
                        }))
                      }
                      placeholder="Optional note"
                      rows={2}
                      value={answer.comment}
                    />
                  </fieldset>
                );
              })}
            </div>
          </details>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{review.target.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Version {review.target.version} · exact text for this review
            </p>
          </div>
          <Link
            className="text-xs font-semibold underline underline-offset-4"
            href={`/documents/${review.target.revisionId}`}
          >
            Open exact version
          </Link>
        </div>
        <div className="mt-4 border-y border-foreground py-5">
          <RichMarkdown markdown={review.target.body} />
        </div>
      </div>

      <div className="mt-5 border border-foreground p-4">
        <h3 className="text-sm font-semibold">
          {isStale ? "Discussion on this version" : "Leave specific feedback"}
        </h3>
        {!isStale ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Put questions, evidence, and clause-level changes in the discussion.
            Votes rank useful comments; they do not approve this version.
          </p>
        ) : null}
        <Link className={`${secondaryButtonClassName} mt-3`} href="#discussion">
          Open discussion
        </Link>
      </div>

      {review.state === "STALE" ? null : review.response && !panel.canSubmit ? (
        <div className="mt-5 border border-foreground p-4">
          <h3 className="text-sm font-semibold">Your decision</h3>
          <p className="mt-2 text-base font-semibold">
            {verdictLabels[review.response.verdict]}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {review.response.explanation}
          </p>
          {review.response.proposalDocument ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your full proposed revision is preserved below.
            </p>
          ) : null}
        </div>
      ) : panel.canSubmit ? (
        <div className="mt-6" id="review-decision">
          <h3 className="text-base font-semibold">Your decision</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This decision applies only to version {review.target.version}.
          </p>
          {review.request.checklist.length > 0 ? (
            <p
              className="mt-2 text-sm text-muted-foreground"
              id="approve-criteria-note"
            >
              Approving confirms every required criterion listed above passes.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              aria-describedby={
                review.request.checklist.length > 0
                  ? "approve-criteria-note"
                  : undefined
              }
              aria-pressed={verdict === "APPROVE"}
              className={primaryButtonClassName}
              disabled={isWorking}
              onClick={() => void approveReview()}
              type="button"
            >
              {isSubmitting && verdict === "APPROVE"
                ? "Submitting…"
                : "Approve this version"}
            </button>
            <button
              aria-pressed={verdict === "CHANGES_REQUESTED"}
              className={secondaryButtonClassName}
              disabled={isWorking}
              onClick={() => chooseVerdict("CHANGES_REQUESTED")}
              type="button"
            >
              Request changes
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Request changes when specific revisions could make this version
            acceptable.
          </p>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold">
              Reject or abstain
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">
              Reject if this version should not proceed. Abstain if you cannot
              assess it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                aria-pressed={verdict === "REJECT"}
                className={secondaryButtonClassName}
                disabled={isWorking}
                onClick={() => chooseVerdict("REJECT")}
                type="button"
              >
                Reject this version
              </button>
              <button
                aria-pressed={verdict === "ABSTAIN"}
                className={secondaryButtonClassName}
                disabled={isWorking}
                onClick={() => chooseVerdict("ABSTAIN")}
                type="button"
              >
                Abstain
              </button>
            </div>
          </details>

          {error ? (
            <p className="mt-3 text-sm font-semibold" role="alert">
              {error}
            </p>
          ) : null}

          {verdict && verdict !== "APPROVE" ? (
            <form
              className="mt-5 border-t border-foreground pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitDetailedDecision();
              }}
            >
              {verdict === "CHANGES_REQUESTED" ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  We&apos;ll post this feedback in the discussion and preserve
                  it as your decision.
                </p>
              ) : null}
              <label className="block space-y-2 text-sm font-semibold">
                <span>{explanationLabel(verdict)}</span>
                <textarea
                  className={fieldClassName}
                  onChange={(event) => setExplanation(event.target.value)}
                  placeholder={explanationPlaceholder(verdict)}
                  required
                  rows={5}
                  value={explanation}
                />
              </label>
              {review.request.checklist.length > 0 ? (
                <button
                  className="mt-3 text-sm font-semibold underline underline-offset-4"
                  onClick={() => setCriteriaOpen(true)}
                  type="button"
                >
                  Add criterion details
                </button>
              ) : null}
              {isEditingProposal ? (
                <p className="mt-4 border border-foreground p-3 text-sm">
                  Your decision will include the full proposed revision below.
                  Your proposal does not change the document by itself.
                </p>
              ) : null}
              <button
                className={`${primaryButtonClassName} mt-4`}
                disabled={isWorking}
                type="submit"
              >
                {isWorking ? "Submitting…" : submitLabels[verdict]}
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          This review cannot accept a response.
        </p>
      )}

      {review.proposal ? (
        <details className="mt-6 border-t border-foreground pt-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Full proposed revision
          </summary>
          <div className="mt-4">
            <DocumentReviewAnnotatedDiff
              afterLabel="Your proposed version"
              afterRevision={review.proposal}
              beforeLabel={`Reviewed version ${review.target.version}`}
              beforeRevision={review.target}
              reviewTaskId={review.reviewTaskId}
            />
          </div>
        </details>
      ) : panel.canSubmit ? (
        <details className="mt-6 border-t border-foreground pt-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced: propose a full revision
          </summary>
          <div className="mt-4">
            {!isEditingProposal ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Use this only when comments would be slower than supplying the
                  complete replacement text.
                </p>
                <button
                  className={`${secondaryButtonClassName} mt-3`}
                  onClick={() => {
                    setIsEditingProposal(true);
                    setProposalBody(review.target.body);
                    setProposalTitle(review.target.title);
                  }}
                  type="button"
                >
                  Start full revision
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm font-semibold">
                    <span>Proposed title</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => setProposalTitle(event.target.value)}
                      value={proposalTitle}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    <span>Proposed text</span>
                    <textarea
                      className={fieldClassName}
                      onChange={(event) => setProposalBody(event.target.value)}
                      rows={18}
                      value={proposalBody}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setIsEditingProposal(false);
                      setProposalBody("");
                      setProposalTitle(review.target.title);
                    }}
                    type="button"
                  >
                    Discard full revision
                  </button>
                  <button
                    className={primaryButtonClassName}
                    onClick={() => chooseVerdict("CHANGES_REQUESTED")}
                    type="button"
                  >
                    Request these changes
                  </button>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Change preview</h4>
                  <DocumentRevisionDiff
                    afterBody={deferredProposalBody}
                    afterLabel="Draft proposal"
                    beforeBody={review.target.body}
                    beforeLabel={`Reviewed version ${review.target.version}`}
                  />
                </div>
              </div>
            )}
          </div>
        </details>
      ) : null}

      <details className="mt-6 border-t border-foreground pt-4">
        <summary className="cursor-pointer text-sm font-semibold">
          History and technical proof
        </summary>
        <div className="mt-4 space-y-4 text-sm">
          <div className="border-l border-foreground pl-4">
            <p className="font-semibold">Review requested</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatUtcDateTime(review.request.requestedAt)} · version{" "}
              {review.target.version}
            </p>
          </div>
          {review.response ? (
            <div className="border-l border-foreground pl-4">
              <p className="font-semibold">
                {verdictLabels[review.response.verdict]} submitted
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatUtcDateTime(review.response.submittedAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                {review.response.explanation}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No decision submitted.</p>
          )}
          {review.state === "STALE" ? (
            <p className="border border-foreground p-4 font-semibold">
              This review remains attached to version {review.target.version},
              but the authoritative document has changed.
            </p>
          ) : null}
          <IntegrityProof
            items={[
              { label: "Document ID", value: review.target.documentId },
              { label: "Revision ID", value: review.target.revisionId },
              { label: "Revision hash", value: review.target.contentHash },
              ...(review.response
                ? [
                    {
                      label: "Review artifact",
                      value: review.response.artifactId,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </details>
    </section>
  );
}
