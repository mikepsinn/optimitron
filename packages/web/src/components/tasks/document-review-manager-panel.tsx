"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { DocumentCreateDialog } from "@/components/documents/document-create-dialog";
import { DocumentReviewAnnotatedDiff } from "@/components/documents/document-review-annotated-diff";
import { IntegrityProof } from "@/components/ui/integrity-proof";
import { API_ROUTES } from "@/lib/api-routes";
import { deriveDocumentAdoptionReadiness } from "@/lib/tasks/document-review-readiness";
import type { DocumentReviewManagerSetupData } from "@/lib/tasks/document-review-ui.server";
import type {
  DocumentReviewPanelData,
  DocumentReviewPanelReview,
} from "@/lib/tasks/document-review.server";

type ManagerPanel = Extract<DocumentReviewPanelData, { mode: "MANAGER" }>;
type ManagerView = "CHANGES" | "HISTORY" | "OVERVIEW" | "REVIEWS";

const managerViews: Array<{ id: ManagerView; label: string }> = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "CHANGES", label: "Changes" },
  { id: "REVIEWS", label: "Reviews" },
  { id: "HISTORY", label: "History" },
];

const fieldClassName =
  "w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";
const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60";

const stateLabels: Record<DocumentReviewPanelReview["state"], string> = {
  ABSTAINED: "Abstained",
  APPROVED: "Approved",
  AWAITING_RESPONSE: "Awaiting response",
  AWAITING_VERIFICATION: "Completion check needed",
  CHANGES_REQUESTED: "Changes requested",
  DELIVERY_REJECTED: "Marked incomplete",
  REJECTED: "Rejected",
  STALE: "Stale",
};

async function expectOk(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) throw new Error(payload?.error ?? fallback);
}

interface IdempotencyState {
  fingerprint: string;
  key: string;
}

function idempotencyKey(
  state: { current: IdempotencyState | null },
  prefix: string,
  fingerprint: string,
) {
  if (state.current?.fingerprint !== fingerprint) {
    state.current = {
      fingerprint,
      key: `${prefix}:${crypto.randomUUID()}`,
    };
  }
  return state.current.key;
}

function formatUtcDateTime(value: string) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function DocumentReviewManagerPanel({
  panel,
  setup,
}: {
  panel: ManagerPanel;
  setup: DocumentReviewManagerSetupData;
}) {
  const router = useRouter();
  const adoptionIdempotency = useRef<IdempotencyState | null>(null);
  const reviewIdempotency = useRef<IdempotencyState | null>(null);
  const [activeView, setActiveView] = useState<ManagerView>("OVERVIEW");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [checklistText, setChecklistText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [fundingTermsRevisionId, setFundingTermsRevisionId] = useState<
    string | null
  >(null);
  const [required, setRequired] = useState(true);
  const [reviewTitle, setReviewTitle] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const [preparedInvitationTaskIds, setPreparedInvitationTaskIds] = useState<
    Record<string, true>
  >({});
  const [publicationDrafts, setPublicationDrafts] = useState<
    Record<
      string,
      {
        description: string;
        kind: string;
        question: string;
        slug: string;
      }
    >
  >({});
  const [selectedDocumentRevisionId, setSelectedDocumentRevisionId] = useState(
    setup.documents[0]?.revisionId ?? "",
  );
  const [selectedPersonId, setSelectedPersonId] = useState(
    setup.candidates[0]?.personId ?? "",
  );
  const [verificationNotes, setVerificationNotes] = useState<
    Record<string, string>
  >({});
  const [waiverReasons, setWaiverReasons] = useState<Record<string, string>>(
    {},
  );
  const isBusy = busyKey != null || isRefreshing;

  const effectiveDocumentRevisionId = setup.documents.some(
    (document) => document.revisionId === selectedDocumentRevisionId,
  )
    ? selectedDocumentRevisionId
    : (setup.documents[0]?.revisionId ?? "");
  const effectivePersonId = setup.candidates.some(
    (candidate) => candidate.personId === selectedPersonId,
  )
    ? selectedPersonId
    : (setup.candidates[0]?.personId ?? "");
  const selectedCandidate = useMemo(
    () =>
      setup.candidates.find(
        (candidate) => candidate.personId === effectivePersonId,
      ) ?? null,
    [effectivePersonId, setup.candidates],
  );

  async function runAction(key: string, action: () => Promise<void>) {
    if (isBusy) return;
    setActionError(null);
    setBusyKey(key);
    try {
      await action();
      startRefresh(() => router.refresh());
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The action did not finish.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function requestReview() {
    const checklist = checklistText
      .split("\n")
      .map((criterion) => criterion.trim())
      .filter(Boolean)
      .map((criterion, index) => ({
        criterion,
        id: `check-${index + 1}`,
        required: true,
      }));
    const body = {
      checklist,
      documentRevisionId: effectiveDocumentRevisionId,
      instructions: instructions.trim(),
      required,
      reviewerPersonId: effectivePersonId,
      ...(reviewTitle.trim() ? { title: reviewTitle.trim() } : {}),
    };
    const fingerprint = JSON.stringify(body);
    const response = await fetch(
      API_ROUTES.tasks.documentReviews(panel.authorityTaskId),
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey(
            reviewIdempotency,
            "document-review",
            fingerprint,
          ),
        },
        method: "POST",
      },
    );
    await expectOk(response, "Could not create the review task.");
    reviewIdempotency.current = null;
    setChecklistText("");
    setInstructions("");
    setReviewTitle("");
  }

  async function verifyDelivery(
    review: DocumentReviewPanelReview,
    result: "ACCEPTED" | "REJECTED",
  ) {
    if (!review.verification) return;
    const response = await fetch(
      API_ROUTES.tasks.documentReviewVerification(
        panel.authorityTaskId,
        review.reviewTaskId,
      ),
      {
        body: JSON.stringify({
          criterionResults: [],
          note: verificationNotes[review.reviewTaskId]?.trim() || null,
          result,
          taskVerificationId: review.verification.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    await expectOk(response, "Could not record the completion check.");
  }

  async function applyProposal(review: DocumentReviewPanelReview) {
    const response = await fetch(
      API_ROUTES.tasks.documentReviewApplyProposal(
        panel.authorityTaskId,
        review.reviewTaskId,
      ),
      {
        body: JSON.stringify({
          expectedDocumentVersion: review.target.version,
          reviewTaskId: review.reviewTaskId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    await expectOk(response, "Could not apply the proposed revision.");
  }

  async function prepareInvitation(review: DocumentReviewPanelReview) {
    const response = await fetch(
      API_ROUTES.tasks.documentReviewInvitations(panel.authorityTaskId),
      {
        body: JSON.stringify({
          batchKey: `review:${panel.authorityTaskId}:${review.target.revisionId}`,
          kind: "INVITATION",
          recipientPersonId: review.reviewer.id,
          revision: {
            contentHash: review.target.contentHash,
            documentId: review.target.documentId,
            documentRevisionId: review.target.revisionId,
            documentVersion: review.target.version,
          },
          taskId: review.reviewTaskId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    await expectOk(response, "Could not prepare the invitation.");
    setPreparedInvitationTaskIds((current) => ({
      ...current,
      [review.reviewTaskId]: true,
    }));
  }

  async function adoptRevision(
    document: DocumentReviewManagerSetupData["documents"][number],
  ) {
    const matchingReviews = panel.reviews.filter(
      (review) => review.target.revisionId === document.revisionId,
    );
    const waivers = matchingReviews.flatMap((review) => {
      if (!review.required || review.state === "APPROVED") return [];
      const reason = waiverReasons[review.reviewTaskId]?.trim() ?? "";
      return reason ? [{ reason, reviewTaskId: review.reviewTaskId }] : [];
    });
    const body = {
      documentRevisionId: document.revisionId,
      useAsFundingTerms: fundingTermsRevisionId === document.revisionId,
      waivers,
    };
    const fingerprint = JSON.stringify(body);
    const response = await fetch(
      API_ROUTES.tasks.documentReviewAdoption(panel.authorityTaskId),
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey(
            adoptionIdempotency,
            "document-adoption",
            fingerprint,
          ),
        },
        method: "POST",
      },
    );
    await expectOk(response, "Could not adopt the revision.");
    adoptionIdempotency.current = null;
  }

  async function publishDecision(decisionArtifactId: string) {
    const draft = publicationDrafts[decisionArtifactId] ?? {
      description: "",
      kind: "GENERAL",
      question: "",
      slug: "",
    };
    const response = await fetch(
      API_ROUTES.tasks.documentReviewPublication(panel.authorityTaskId),
      {
        body: JSON.stringify({
          decisionArtifactId,
          ...(draft.description.trim()
            ? { description: draft.description.trim() }
            : {}),
          kind: draft.kind,
          question: draft.question.trim(),
          slug: draft.slug.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
    await expectOk(response, "Could not publish the referendum.");
  }

  return (
    <section
      aria-labelledby="document-review-manager-heading"
      className="border-b border-foreground py-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Document decisions
      </p>
      <h2
        className="mt-2 text-xl font-semibold"
        id="document-review-manager-heading"
      >
        Assign exact-version reviews
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Each reviewer gets one private task and one frozen version. Reviews
        advise the manager; only a recorded adoption decision changes what the
        organization accepts.
      </p>

      <nav
        aria-label="Document review views"
        className="mt-5 flex gap-1 overflow-x-auto border-b border-foreground"
      >
        {managerViews.map((view) => (
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
        <details className="mt-5 border border-foreground p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Create a review task
          </summary>
          {setup.documents.length === 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Add the exact text that reviewers should inspect.
              </p>
              <DocumentCreateDialog
                navigateToDocument={false}
                taskId={panel.authorityTaskId}
                triggerLabel="Create and attach document"
              />
            </div>
          ) : setup.candidates.length === 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                No qualified reviewers have been saved for this task yet.
              </p>
              <Link className={secondaryButtonClassName} href="/people">
                Browse people
              </Link>
              <p className="text-xs text-muted-foreground">
                Check qualifications, conflicts, and published contact sources
                before adding someone to this task.
              </p>
            </div>
          ) : (
            <form
              className="mt-4 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("request", requestReview);
              }}
            >
              <label className="grid gap-2 text-sm font-semibold">
                <span>Document version</span>
                <select
                  className={fieldClassName}
                  onChange={(event) =>
                    setSelectedDocumentRevisionId(event.target.value)
                  }
                  required
                  value={effectiveDocumentRevisionId}
                >
                  {setup.documents.map((document) => (
                    <option
                      key={document.revisionId}
                      value={document.revisionId}
                    >
                      {document.title} · v{document.version}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Reviewer</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => setSelectedPersonId(event.target.value)}
                  required
                  value={effectivePersonId}
                >
                  {setup.candidates.map((candidate) => (
                    <option key={candidate.personId} value={candidate.personId}>
                      {candidate.displayName}
                      {candidate.email ? ` · ${candidate.email}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {selectedCandidate?.evidence ? (
                <div className="border border-foreground p-3 text-sm">
                  <p className="font-semibold">
                    {selectedCandidate.evidence.fitSummary}
                  </p>
                  <p className="mt-3 text-xs font-semibold">Qualifications</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {selectedCandidate.evidence.qualifications.map(
                      (qualification) => (
                        <li key={qualification.claim}>
                          {qualification.claim} ·{" "}
                          {qualification.verified
                            ? "verified"
                            : "not independently verified"}{" "}
                          {qualification.sourceUrls.map((url, index) => (
                            <span key={url}>
                              {index === 0 ? "· " : ", "}
                              <a
                                className="underline underline-offset-4"
                                href={url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                source {index + 1}
                              </a>
                            </span>
                          ))}
                        </li>
                      ),
                    )}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {selectedCandidate.evidence.conflicts.length > 0
                      ? `Conflicts: ${selectedCandidate.evidence.conflicts.join("; ")}`
                      : "No recorded conflicts."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCandidate.evidence.uncertainties.length > 0
                      ? `Uncertainties: ${selectedCandidate.evidence.uncertainties.join("; ")}`
                      : "No recorded uncertainties."}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs">
                    {selectedCandidate.evidence.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          className="underline underline-offset-4"
                          href={source.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {source.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <label className="grid gap-2 text-sm font-semibold">
                <span>Task title (optional)</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Review the financing packet"
                  value={reviewTitle}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Instructions *</span>
                <textarea
                  className={fieldClassName}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="State the questions this reviewer should answer and the limits of the assignment."
                  required
                  rows={5}
                  value={instructions}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Checklist (one check per line)</span>
                <textarea
                  className={fieldClassName}
                  onChange={(event) => setChecklistText(event.target.value)}
                  placeholder={
                    "Facts and identities are correct\nAuthority is documented\nMaterial risks are explained"
                  }
                  rows={4}
                  value={checklistText}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  checked={required}
                  onChange={(event) => setRequired(event.target.checked)}
                  type="checkbox"
                />
                Required for adoption unless the manager records a waiver
              </label>
              <div>
                <button
                  className={primaryButtonClassName}
                  disabled={isBusy}
                  type="submit"
                >
                  {busyKey === "request"
                    ? "Creating…"
                    : "Create private review task"}
                </button>
              </div>
            </form>
          )}
        </details>
      ) : null}

      {activeView === "CHANGES" ? (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold">Proposed changes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare each reviewer&apos;s proposal with the exact version they
              reviewed.
            </p>
          </div>
          {panel.reviews.some((review) => review.proposal) ? (
            panel.reviews.map((review) =>
              review.proposal ? (
                <article
                  className="border border-foreground p-4"
                  key={review.reviewTaskId}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {review.reviewer.displayName}&apos;s proposal
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.target.title} · version {review.target.version}
                      </p>
                    </div>
                    <Link
                      className="text-xs font-semibold underline underline-offset-4"
                      href={`/tasks/${review.reviewTaskId}#discussion`}
                    >
                      Open discussion
                    </Link>
                  </div>
                  <div className="mt-4">
                    <DocumentReviewAnnotatedDiff
                      afterLabel="Proposed version"
                      afterRevision={review.proposal}
                      beforeLabel={`Reviewed version ${review.target.version}`}
                      beforeRevision={review.target}
                      reviewTaskId={review.reviewTaskId}
                    />
                  </div>
                  {!review.target.stale &&
                  review.verification?.result === "ACCEPTED" &&
                  review.state !== "DELIVERY_REJECTED" ? (
                    <div className="mt-4 border-t border-foreground pt-4">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Applying this proposal creates a new canonical version.
                        Reviews of the current version then become stale.
                      </p>
                      <button
                        className={secondaryButtonClassName}
                        disabled={isBusy}
                        onClick={() =>
                          void runAction(`apply:${review.reviewTaskId}`, () =>
                            applyProposal(review),
                          )
                        }
                        type="button"
                      >
                        {busyKey === `apply:${review.reviewTaskId}`
                          ? "Applying…"
                          : "Apply proposed revision"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 border-t border-foreground pt-4 text-xs text-muted-foreground">
                      Accept the completed review delivery before applying its
                      proposed text.
                    </p>
                  )}
                </article>
              ) : null,
            )
          ) : (
            <p className="border border-foreground p-4 text-sm text-muted-foreground">
              No reviewer has proposed replacement text yet.
            </p>
          )}
        </div>
      ) : null}

      {activeView === "REVIEWS" ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-base font-semibold">
              Reviews ({panel.reviews.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Discussion votes rank comments only.
            </p>
          </div>
          {panel.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No review tasks yet.
            </p>
          ) : (
            panel.reviews.map((review) => (
              <article
                className="border border-foreground p-4"
                key={review.reviewTaskId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold">
                      {review.reviewer.displayName}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {review.reviewer.email ?? "No email recorded"} ·{" "}
                      {review.required ? "Required" : "Advisory"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {review.target.title} · version {review.target.version}
                    </p>
                    <Link
                      className="mt-2 inline-block text-xs font-semibold underline underline-offset-4"
                      href={`/tasks/${review.reviewTaskId}#discussion`}
                    >
                      Open review and discussion
                    </Link>
                    <IntegrityProof
                      className="mt-2"
                      items={[
                        {
                          label: "Document ID",
                          value: review.target.documentId,
                        },
                        {
                          label: "Revision ID",
                          value: review.target.revisionId,
                        },
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

                {review.response ? (
                  <div className="mt-4 space-y-2 border-t border-foreground pt-3 text-sm">
                    <p className="font-semibold">
                      Verdict:{" "}
                      {review.response.verdict
                        .replaceAll("_", " ")
                        .toLowerCase()}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {review.response.explanation}
                    </p>
                    {review.response.checklistResponses.length > 0 ? (
                      <ul className="space-y-2 border-t border-foreground pt-3">
                        {review.response.checklistResponses.map((answer) => {
                          const criterion = review.request.checklist.find(
                            (item) => item.id === answer.criterionId,
                          );
                          return (
                            <li key={answer.criterionId}>
                              <p className="font-semibold">
                                {answer.result
                                  .replaceAll("_", " ")
                                  .toLowerCase()}
                                {criterion ? ` · ${criterion.criterion}` : ""}
                              </p>
                              {answer.comment ? (
                                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                  {answer.comment}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {review.state === "AWAITING_RESPONSE" ? (
                  <div className="mt-4">
                    <button
                      className={secondaryButtonClassName}
                      disabled={!review.reviewer.email || isBusy}
                      onClick={() =>
                        void runAction(`invite:${review.reviewTaskId}`, () =>
                          prepareInvitation(review),
                        )
                      }
                      type="button"
                    >
                      {busyKey === `invite:${review.reviewTaskId}`
                        ? "Preparing…"
                        : "Prepare invitation for approval"}
                    </button>
                    {!review.reviewer.email ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Add a published business email before preparing
                        outreach.
                      </p>
                    ) : null}
                    {preparedInvitationTaskIds[review.reviewTaskId] ? (
                      <p className="mt-2 text-xs font-semibold" role="status">
                        Invitation prepared. Review the frozen invitation batch
                        in{" "}
                        <a
                          className="underline underline-offset-4"
                          href="#outbound-approvals"
                        >
                          pending approvals below
                        </a>
                        .
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {review.state === "AWAITING_VERIFICATION" &&
                review.verification ? (
                  <div className="mt-4 space-y-3 border-t border-foreground pt-3">
                    <label className="grid gap-2 text-sm font-semibold">
                      <span>Completion-check note (optional)</span>
                      <textarea
                        className={fieldClassName}
                        onChange={(event) =>
                          setVerificationNotes((current) => ({
                            ...current,
                            [review.reviewTaskId]: event.target.value,
                          }))
                        }
                        rows={2}
                        value={verificationNotes[review.reviewTaskId] ?? ""}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Check whether the requested review was completed. Do not
                      change the reviewer&apos;s substantive verdict.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={primaryButtonClassName}
                        disabled={isBusy}
                        onClick={() =>
                          void runAction(`verify:${review.reviewTaskId}`, () =>
                            verifyDelivery(review, "ACCEPTED"),
                          )
                        }
                        type="button"
                      >
                        Confirm review completed
                      </button>
                      <button
                        className={secondaryButtonClassName}
                        disabled={isBusy}
                        onClick={() =>
                          void runAction(`reject:${review.reviewTaskId}`, () =>
                            verifyDelivery(review, "REJECTED"),
                          )
                        }
                        type="button"
                      >
                        Mark review incomplete
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}

      {activeView === "OVERVIEW" && setup.documents.length > 0 ? (
        <div className="mt-7 space-y-4 border-t border-foreground pt-5">
          <h3 className="text-base font-semibold">Adopt a version</h3>
          <p className="text-sm text-muted-foreground">
            Every required review must be independently approved and accepted,
            or have a permanent reasoned waiver.
          </p>
          {setup.documents.map((document) => {
            const matchingReviews = panel.reviews.filter(
              (review) => review.target.revisionId === document.revisionId,
            );
            const unresolved = matchingReviews.filter(
              (review) => review.required && review.state !== "APPROVED",
            );
            const adopted = setup.decisions.some(
              (decision) =>
                decision.adoptedDocument.revisionId === document.revisionId,
            );
            const readiness = deriveDocumentAdoptionReadiness({
              adopted,
              reviews: matchingReviews,
              waiverReasons,
            });
            const requiredReviews = matchingReviews.filter(
              (review) => review.required,
            );
            const approvedRequiredReviews = requiredReviews.filter(
              (review) => review.state === "APPROVED",
            );
            const hasProposal = matchingReviews.some(
              (review) => review.proposal != null,
            );
            return (
              <article
                className="border border-foreground p-4"
                key={document.revisionId}
              >
                <h4 className="font-semibold">
                  {document.title} · v{document.version}
                </h4>
                <IntegrityProof
                  className="mt-2"
                  items={[
                    { label: "Revision ID", value: document.revisionId },
                    { label: "Revision hash", value: document.contentHash },
                  ]}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className={secondaryButtonClassName}
                    href={`/documents/${document.revisionId}`}
                  >
                    Read exact version
                  </Link>
                  {hasProposal ? (
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => setActiveView("CHANGES")}
                      type="button"
                    >
                      Review proposed changes
                    </button>
                  ) : null}
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => setActiveView("REVIEWS")}
                    type="button"
                  >
                    Review verdicts
                  </button>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {approvedRequiredReviews.length} of {requiredReviews.length}{" "}
                  required reviews are approved with completion confirmed.
                </p>
                <p className="mt-4 border-y border-foreground py-3 text-sm font-semibold">
                  {readiness.label}
                </p>
                {unresolved.map((review) => (
                  <label
                    className="mt-4 grid gap-2 text-sm font-semibold"
                    key={review.reviewTaskId}
                  >
                    <span>
                      Waiver reason for {review.reviewer.displayName} (
                      {stateLabels[review.state]})
                    </span>
                    <textarea
                      className={fieldClassName}
                      minLength={10}
                      onChange={(event) =>
                        setWaiverReasons((current) => ({
                          ...current,
                          [review.reviewTaskId]: event.target.value,
                        }))
                      }
                      placeholder="Explain why adoption should proceed without this required approval."
                      rows={3}
                      value={waiverReasons[review.reviewTaskId] ?? ""}
                    />
                  </label>
                ))}
                {!adopted ? (
                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <input
                      checked={fundingTermsRevisionId === document.revisionId}
                      className="mt-1 size-4 rounded-none border-foreground"
                      onChange={(event) =>
                        setFundingTermsRevisionId(
                          event.target.checked ? document.revisionId : null,
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      Use this adopted version as the funding terms for this
                      task. Payments stay closed until adopted terms are bound.
                    </span>
                  </label>
                ) : null}
                <div className="mt-4">
                  <button
                    className={primaryButtonClassName}
                    disabled={!readiness.canAdopt || isBusy}
                    onClick={() =>
                      void runAction(`adopt:${document.revisionId}`, () =>
                        adoptRevision(document),
                      )
                    }
                    type="button"
                  >
                    {adopted ? "Adopted" : "Record adoption"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {activeView === "HISTORY" ? (
        <div className="mt-6">
          <h3 className="text-base font-semibold">Review history</h3>
          {panel.reviews.length > 0 ? (
            <ol className="mt-3 space-y-3 text-sm">
              {panel.reviews.map((review) => (
                <li
                  className="border-l border-foreground pl-4"
                  key={review.reviewTaskId}
                >
                  <p className="font-semibold">
                    Review requested from {review.reviewer.displayName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatUtcDateTime(review.request.requestedAt)} · version{" "}
                    {review.target.version}
                  </p>
                  {review.response ? (
                    <p className="mt-2">
                      {review.response.verdict
                        .replaceAll("_", " ")
                        .toLowerCase()}{" "}
                      verdict submitted{" "}
                      {formatUtcDateTime(review.response.submittedAt)}.
                    </p>
                  ) : (
                    <p className="mt-2 text-muted-foreground">
                      No verdict submitted.
                    </p>
                  )}
                  <IntegrityProof
                    className="mt-2"
                    items={[
                      {
                        label: "Review task",
                        value: review.reviewTaskId,
                      },
                      {
                        label: "Revision hash",
                        value: review.target.contentHash,
                      },
                    ]}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No reviews have been requested.
            </p>
          )}
        </div>
      ) : null}

      {activeView === "HISTORY" && setup.decisions.length > 0 ? (
        <div className="mt-7 border-t border-foreground pt-5">
          <h3 className="text-base font-semibold">Recorded decisions</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {setup.decisions.map((decision) => (
              <li
                className="border border-foreground p-3"
                key={decision.artifactId}
              >
                <p>
                  Adopted version {decision.adoptedDocument.version} at{" "}
                  {formatUtcDateTime(decision.decidedAt)}.{" "}
                  {decision.waivers.length} waiver
                  {decision.waivers.length === 1 ? "" : "s"} recorded.
                </p>
                <IntegrityProof
                  className="mt-2"
                  items={[
                    { label: "Decision artifact", value: decision.artifactId },
                    {
                      label: "Revision ID",
                      value: decision.adoptedDocument.revisionId,
                    },
                    {
                      label: "Revision hash",
                      value: decision.adoptedDocument.contentHash,
                    },
                  ]}
                />
                <details className="mt-3 border-t border-foreground pt-3">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Publish this exact text as a referendum
                  </summary>
                  <div className="mt-4 grid gap-3">
                    <p className="text-xs text-muted-foreground">
                      Expert reviews and public votes remain separate signals.
                      Publishing creates a locked ballot snapshot; later
                      revisions need a new referendum.
                    </p>
                    <label className="grid gap-2 font-semibold">
                      <span>Ballot question</span>
                      <input
                        className={fieldClassName}
                        onChange={(event) =>
                          setPublicationDrafts((current) => ({
                            ...current,
                            [decision.artifactId]: {
                              description:
                                current[decision.artifactId]?.description ?? "",
                              kind:
                                current[decision.artifactId]?.kind ?? "GENERAL",
                              question: event.target.value,
                              slug: current[decision.artifactId]?.slug ?? "",
                            },
                          }))
                        }
                        placeholder="Should this adopted text take effect?"
                        value={
                          publicationDrafts[decision.artifactId]?.question ?? ""
                        }
                      />
                    </label>
                    <label className="grid gap-2 font-semibold">
                      <span>URL slug</span>
                      <input
                        className={fieldClassName}
                        onChange={(event) =>
                          setPublicationDrafts((current) => ({
                            ...current,
                            [decision.artifactId]: {
                              description:
                                current[decision.artifactId]?.description ?? "",
                              kind:
                                current[decision.artifactId]?.kind ?? "GENERAL",
                              question:
                                current[decision.artifactId]?.question ?? "",
                              slug: event.target.value,
                            },
                          }))
                        }
                        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                        placeholder="adopted-policy-name"
                        value={
                          publicationDrafts[decision.artifactId]?.slug ?? ""
                        }
                      />
                    </label>
                    <label className="grid gap-2 font-semibold">
                      <span>Referendum kind</span>
                      <select
                        className={fieldClassName}
                        onChange={(event) =>
                          setPublicationDrafts((current) => ({
                            ...current,
                            [decision.artifactId]: {
                              description:
                                current[decision.artifactId]?.description ?? "",
                              kind: event.target.value,
                              question:
                                current[decision.artifactId]?.question ?? "",
                              slug: current[decision.artifactId]?.slug ?? "",
                            },
                          }))
                        }
                        value={
                          publicationDrafts[decision.artifactId]?.kind ??
                          "GENERAL"
                        }
                      >
                        <option value="GENERAL">General</option>
                        <option value="DECLARATION">Declaration</option>
                        <option value="TREATY">Treaty</option>
                        <option value="MEMBERSHIP">Membership</option>
                        <option value="AMENDMENT">Amendment</option>
                        <option value="BUDGET">Budget</option>
                      </select>
                    </label>
                    <label className="grid gap-2 font-semibold">
                      <span>Short public description (optional)</span>
                      <textarea
                        className={fieldClassName}
                        onChange={(event) =>
                          setPublicationDrafts((current) => ({
                            ...current,
                            [decision.artifactId]: {
                              description: event.target.value,
                              kind:
                                current[decision.artifactId]?.kind ?? "GENERAL",
                              question:
                                current[decision.artifactId]?.question ?? "",
                              slug: current[decision.artifactId]?.slug ?? "",
                            },
                          }))
                        }
                        rows={3}
                        value={
                          publicationDrafts[decision.artifactId]?.description ??
                          ""
                        }
                      />
                    </label>
                    <div>
                      <button
                        className={secondaryButtonClassName}
                        disabled={isBusy}
                        onClick={() =>
                          void runAction(`publish:${decision.artifactId}`, () =>
                            publishDecision(decision.artifactId),
                          )
                        }
                        type="button"
                      >
                        Publish locked referendum
                      </button>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-5 text-sm font-semibold" role="alert">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}
