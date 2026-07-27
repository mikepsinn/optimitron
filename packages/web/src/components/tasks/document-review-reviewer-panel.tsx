"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
type ReviewerView = "CHANGES" | "HISTORY" | "OVERVIEW" | "REVIEW";

const reviewerViews: Array<{ id: ReviewerView; label: string }> = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "CHANGES", label: "Document" },
  { id: "REVIEW", label: "Review" },
  { id: "HISTORY", label: "History" },
];

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

export function DocumentReviewReviewerPanel({
  panel,
}: {
  panel: ReviewerPanel;
}) {
  const router = useRouter();
  const { review } = panel;
  const [activeView, setActiveView] = useState<ReviewerView>(
    panel.canSubmit ? "CHANGES" : "HISTORY",
  );
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
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalBody, setProposalBody] = useState("");
  const [proposalTitle, setProposalTitle] = useState(review.target.title);
  const [verdict, setVerdict] = useState<Verdict | "">("");
  const deferredProposalBody = useDeferredValue(proposalBody);
  const isWorking = isSubmitting || isRefreshing;

  async function submitReview() {
    if (isWorking) return;
    setError(null);
    const missing = review.request.checklist.find(
      (item) => item.required && !answers[item.id]?.result,
    );
    if (missing) {
      setError(`Answer the required check: ${missing.criterion}`);
      return;
    }
    if (!verdict) {
      setError("Choose a verdict.");
      return;
    }
    if (!explanation.trim()) {
      setError("Explain your verdict.");
      return;
    }
    if (isEditingProposal && !proposalBody.trim()) {
      setError(
        "Proposed text cannot be empty. Discard it to submit without edits.",
      );
      return;
    }
    if (isEditingProposal && !proposalTitle.trim()) {
      setError("A proposed revision needs a title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        API_ROUTES.tasks.documentReviewResponse(review.reviewTaskId),
        {
          body: JSON.stringify({
            checklistResponses: review.request.checklist.flatMap((item) => {
              const answer = answers[item.id];
              if (!answer?.result) return [];
              return [
                {
                  ...(answer.comment.trim()
                    ? { comment: answer.comment.trim() }
                    : {}),
                  criterionId: item.id,
                  result: answer.result,
                },
              ];
            }),
            explanation: explanation.trim(),
            ...(isEditingProposal
              ? {
                  proposal: {
                    body: proposalBody.trim(),
                    title: proposalTitle.trim(),
                  },
                }
              : {}),
            verdict,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      await readResponse(response);
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
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {review.required ? "Required independent review" : "Advisory review"}
      </p>
      <h2 className="mt-2 text-xl font-semibold" id="document-review-heading">
        Review this exact version
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Your verdict helps the decision maker use, revise, or reject this text.
        A separate completion check confirms that you finished the assignment;
        it never changes your verdict.
      </p>

      <nav
        aria-label="Document review views"
        className="mt-5 flex gap-1 overflow-x-auto border-b border-foreground"
      >
        {reviewerViews.map((view) => (
          <button
            aria-pressed={activeView === view.id}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${
              activeView === view.id
                ? "border-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            key={view.id}
            onClick={() => setActiveView(view.id)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </nav>

      {activeView === "OVERVIEW" ? (
        <>
          <div className="mt-5 border border-foreground p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  {review.target.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Version {review.target.version} · exact text for this review
                </p>
                <Link
                  className="mt-2 inline-block text-xs font-semibold underline underline-offset-4"
                  href={`/documents/${review.target.revisionId}`}
                >
                  Open this exact version
                </Link>
                <IntegrityProof
                  className="mt-3"
                  items={[
                    { label: "Document ID", value: review.target.documentId },
                    { label: "Revision ID", value: review.target.revisionId },
                    {
                      label: "Revision hash",
                      value: review.target.contentHash,
                    },
                  ]}
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em]">
                {stateLabels[review.state]}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">What to review</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {review.request.instructions}
            </p>
          </div>

          {review.request.checklist.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Checks</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {review.request.checklist.map((item) => (
                  <li key={item.id}>
                    {item.criterion}
                    {item.required ? " (required)" : ""}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      ) : null}

      {activeView === "CHANGES" ? (
        <div className="mt-5 space-y-5">
          <div className="border border-foreground p-4">
            <h3 className="text-sm font-semibold">Your assignment</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {review.request.instructions}
            </p>
            {review.request.checklist.length > 0 ? (
              <>
                <ol className="mt-3 space-y-1 text-sm">
                  {review.request.checklist.map((item) => (
                    <li key={item.id}>
                      {item.criterion}
                      {item.required ? " (required)" : ""}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  Record each result under Review.
                </p>
              </>
            ) : null}
            {panel.canSubmit ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={primaryButtonClassName}
                  onClick={() => setActiveView("REVIEW")}
                  type="button"
                >
                  Record verdict
                </button>
                {!isEditingProposal ? (
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setIsEditingProposal(true);
                      setProposalBody(review.target.body);
                      setProposalTitle(review.target.title);
                    }}
                    type="button"
                  >
                    Propose edits
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Exact text to review</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {review.target.title} · version {review.target.version}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Link className="underline underline-offset-4" href="#discussion">
                Open discussion
              </Link>
            </div>
          </div>

          {review.proposal ? (
            <DocumentReviewAnnotatedDiff
              afterLabel="Your proposed version"
              afterRevision={review.proposal}
              beforeLabel={`Reviewed version ${review.target.version}`}
              beforeRevision={review.target}
              reviewTaskId={review.reviewTaskId}
            />
          ) : isEditingProposal ? (
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
                  Discard draft
                </button>
                <button
                  className={primaryButtonClassName}
                  onClick={() => setActiveView("REVIEW")}
                  type="button"
                >
                  Record verdict
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
          ) : (
            <>
              <div className="border-y border-foreground py-4">
                <RichMarkdown markdown={review.target.body} />
              </div>
              {panel.canSubmit ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setIsEditingProposal(true);
                      setProposalBody(review.target.body);
                      setProposalTitle(review.target.title);
                    }}
                    type="button"
                  >
                    Propose edits to this text
                  </button>
                  <button
                    className={primaryButtonClassName}
                    onClick={() => setActiveView("REVIEW")}
                    type="button"
                  >
                    Record verdict
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {activeView === "REVIEW" && review.state === "STALE" ? (
        <p className="mt-5 border border-foreground p-4 text-sm font-semibold">
          This assignment is closed because the document changed. Ask the
          manager for a new review task tied to the current version.
        </p>
      ) : activeView === "REVIEW" && review.response && !panel.canSubmit ? (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold">Your recorded verdict</h3>
          <p className="text-base font-semibold">
            {verdictLabels[review.response.verdict]}
          </p>
          <p className="whitespace-pre-wrap text-sm">
            {review.response.explanation}
          </p>
          {review.response.proposalDocument ? (
            <p className="text-sm text-muted-foreground">
              Your proposed revision is preserved under Changes.
            </p>
          ) : null}
        </div>
      ) : activeView === "REVIEW" && panel.canSubmit ? (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitReview();
          }}
        >
          {review.request.checklist.map((item) => {
            const answer = answers[item.id] ?? { comment: "", result: "" };
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

          <label className="block space-y-2 text-sm font-semibold">
            <span>Verdict *</span>
            <select
              className={fieldClassName}
              onChange={(event) =>
                setVerdict(event.target.value as Verdict | "")
              }
              required
              value={verdict}
            >
              <option value="">Choose a verdict</option>
              <option value="APPROVE">Approve</option>
              <option value="CHANGES_REQUESTED">Changes requested</option>
              <option value="REJECT">Reject</option>
              <option value="ABSTAIN">Abstain</option>
            </select>
          </label>

          <label className="block space-y-2 text-sm font-semibold">
            <span>Explanation *</span>
            <textarea
              className={fieldClassName}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder="What should the decision maker know?"
              required
              rows={5}
              value={explanation}
            />
          </label>

          {isEditingProposal ? (
            <p className="border border-foreground p-3 text-sm">
              Your verdict will include the proposed version shown under
              Changes. The authoritative document stays unchanged unless the
              manager applies it.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm font-semibold" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className={primaryButtonClassName}
            disabled={isWorking}
            type="submit"
          >
            {isWorking ? "Submitting…" : "Submit verdict"}
          </button>
        </form>
      ) : activeView === "REVIEW" ? (
        <p className="mt-5 text-sm text-muted-foreground">
          This assignment cannot accept a response.
        </p>
      ) : null}

      {activeView === "HISTORY" ? (
        <div className="mt-5 space-y-4 text-sm">
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
                {verdictLabels[review.response.verdict]} verdict submitted
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatUtcDateTime(review.response.submittedAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                {review.response.explanation}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No verdict submitted.</p>
          )}
          {review.state === "STALE" ? (
            <p className="border border-foreground p-4 font-semibold">
              This review remains attached to version {review.target.version},
              but it is outdated because the authoritative document changed.
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
      ) : null}
    </section>
  );
}
