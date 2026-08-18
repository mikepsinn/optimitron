"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { API_ROUTES } from "@/lib/api-routes";
import type { DocumentReviewManagerSetupData } from "@/lib/tasks/document-review-ui.server";
import type {
  DocumentProposalPreview,
  DocumentReviewPanelData,
  DocumentReviewPanelReview,
} from "@/lib/tasks/document-review.server";

type ManagerPanel = Extract<DocumentReviewPanelData, { mode: "MANAGER" }>;
type DecisionAction = "ADOPT" | "REJECT";
type Verdict = "APPROVE" | "CHANGES_REQUESTED" | "REJECT" | "ABSTAIN";

interface PersonSearchResult {
  affiliation: string | null;
  displayName: string;
  handle: string | null;
  headline: string | null;
  id: string;
}

interface IdempotencyState {
  fingerprint: string;
  key: string;
}

const fieldClassName =
  "w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";
const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-background px-4 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const stateLabels: Record<DocumentReviewPanelReview["state"], string> = {
  ABSTAINED: "Abstained",
  APPROVED: "Approved",
  AWAITING_RESPONSE: "Awaiting review",
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

async function expectOk(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) throw new Error(payload?.error ?? fallback);
}

function getIdempotencyKey(
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

export function DocumentReviewManagerPanel({
  panel,
  setup,
}: {
  panel: ManagerPanel;
  setup: DocumentReviewManagerSetupData;
}) {
  const router = useRouter();
  const requestIdempotency = useRef<IdempotencyState | null>(null);
  const proposalIdempotency = useRef<IdempotencyState | null>(null);
  const decisionIdempotency = useRef<IdempotencyState | null>(null);
  const [documentRevisionId, setDocumentRevisionId] = useState(
    setup.documents[0]?.revisionId ?? "",
  );
  const [instructions, setInstructions] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = busyKey != null || isRefreshing;

  useEffect(() => {
    if (selectedPerson || personQuery.trim().length < 2) {
      setPeople([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void fetch(
        `/api/people/search?q=${encodeURIComponent(personQuery.trim())}`,
      )
        .then(async (response) => {
          if (!response.ok) return [];
          const payload = (await response.json()) as {
            data?: PersonSearchResult[];
          };
          return payload.data ?? [];
        })
        .then((results) => {
          if (!cancelled) setPeople(results);
        })
        .catch(() => {
          if (!cancelled) setPeople([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [personQuery, selectedPerson]);

  async function runAction(key: string, action: () => Promise<boolean | void>) {
    if (isBusy) return;
    setError(null);
    setBusyKey(key);
    try {
      const changed = await action();
      if (changed !== false) startRefresh(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The action did not finish.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function requestReview() {
    if (!selectedPerson || !documentRevisionId || !instructions.trim()) {
      return false;
    }
    const body = {
      documentRevisionId,
      instructions: instructions.trim(),
      reviewerPersonId: selectedPerson.id,
    };
    const fingerprint = JSON.stringify(body);
    const response = await fetch(
      API_ROUTES.tasks.documentReviews(panel.authorityTaskId),
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": getIdempotencyKey(
            requestIdempotency,
            "document-review",
            fingerprint,
          ),
        },
        method: "POST",
      },
    );
    await expectOk(response, "Could not request the review.");
    requestIdempotency.current = null;
    setInstructions("");
    setPersonQuery("");
    setSelectedPerson(null);
    return true;
  }

  async function applyProposal(proposal: DocumentProposalPreview) {
    if (
      !window.confirm(
        `Create version ${proposal.base.version + 1} from this proposal? Any open reviews of version ${proposal.base.version} will close.`,
      )
    ) {
      return false;
    }
    const body = { proposalArtifactId: proposal.artifactId };
    const fingerprint = JSON.stringify(body);
    const response = await fetch(
      API_ROUTES.tasks.documentReviewProposal(panel.authorityTaskId),
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": getIdempotencyKey(
            proposalIdempotency,
            "document-proposal-application",
            fingerprint,
          ),
        },
        method: "PATCH",
      },
    );
    await expectOk(response, "Could not apply the proposed changes.");
    proposalIdempotency.current = null;
    return true;
  }

  async function decide(
    action: DecisionAction,
    review: DocumentReviewPanelReview,
  ) {
    if (!review.response) return false;
    const reason = rejectReasons[review.reviewTaskId]?.trim() ?? "";
    if (action === "REJECT" && !reason) {
      setError("Explain why this revision should be rejected.");
      return false;
    }
    if (
      action === "ADOPT" &&
      !window.confirm(
        `Use version ${review.target.version} as the working text? This does not sign, file, enact, or publish the document.`,
      )
    ) {
      return false;
    }
    const body = {
      action,
      documentRevisionId: review.target.revisionId,
      reason: action === "REJECT" ? reason : undefined,
      reviewArtifactId: review.response.artifactId,
    };
    const fingerprint = JSON.stringify(body);
    const response = await fetch(
      API_ROUTES.tasks.documentReviewDecision(panel.authorityTaskId),
      {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": getIdempotencyKey(
            decisionIdempotency,
            "document-decision",
            fingerprint,
          ),
        },
        method: "POST",
      },
    );
    await expectOk(response, "Could not record the decision.");
    decisionIdempotency.current = null;
    return true;
  }

  return (
    <section
      aria-labelledby="document-review-manager-heading"
      className="border-b border-foreground py-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Document review
          </p>
          <h2
            className="mt-2 text-xl font-semibold"
            id="document-review-manager-heading"
          >
            Get an independent review
          </h2>
        </div>
        <a
          className="text-sm font-semibold underline underline-offset-4"
          href="#discussion"
        >
          Read discussion
        </a>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Assign one exact version. The reviewer can approve it, request changes,
        reject it, or abstain. Votes only help sort the discussion.
      </p>

      {panel.proposals.length > 0 ? (
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold">Proposed changes</h3>
          {panel.proposals.map((proposal) => (
            <article
              className="border border-foreground p-4"
              key={proposal.artifactId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{proposal.proposed.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Based on version {proposal.base.version} · drawn from{" "}
                    {proposal.sourceComments.length}{" "}
                    {proposal.sourceComments.length === 1
                      ? "comment"
                      : "comments"}
                  </p>
                </div>
                {proposal.baseStale ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    Out of date
                  </span>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">
                {proposal.summary}
              </p>
              <details className="mt-4 border-t border-foreground pt-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Read proposed text
                </summary>
                <div className="mt-3 max-h-96 overflow-y-auto text-sm">
                  <RichMarkdown markdown={proposal.proposed.body} />
                </div>
              </details>
              <p className="mt-4 text-xs text-muted-foreground">
                This creates a new version. It does not approve or adopt it.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {proposal.baseStale ? (
                  <p className="text-sm text-muted-foreground">
                    This proposal cannot be applied to the newer version.
                  </p>
                ) : (
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    onClick={() =>
                      void runAction(`proposal-${proposal.artifactId}`, () =>
                        applyProposal(proposal),
                      )
                    }
                    type="button"
                  >
                    {busyKey === `proposal-${proposal.artifactId}`
                      ? "Creating version…"
                      : `Create version ${proposal.base.version + 1}`}
                  </button>
                )}
                <a
                  className="text-sm font-semibold underline underline-offset-4"
                  href={
                    proposal.sourceComments[0]
                      ? proposal.sourceComments[0].taskId ===
                        panel.authorityTaskId
                        ? `#comment-${proposal.sourceComments[0].commentId}`
                        : `/tasks/${proposal.sourceComments[0].taskId}#comment-${proposal.sourceComments[0].commentId}`
                      : "#discussion"
                  }
                >
                  {proposal.baseStale
                    ? "Request an update"
                    : "Read source comments"}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {setup.documents.length === 0 ? (
        <p className="mt-5 border border-foreground p-4 text-sm">
          Attach a versioned document to this task before requesting a review.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 border border-foreground p-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-semibold">Document version</span>
            <select
              className={fieldClassName}
              onChange={(event) => setDocumentRevisionId(event.target.value)}
              value={documentRevisionId}
            >
              {setup.documents.map((document) => (
                <option key={document.revisionId} value={document.revisionId}>
                  Version {document.version} · {document.title}
                </option>
              ))}
            </select>
          </label>

          <div className="relative space-y-1">
            <label className="block text-sm font-semibold" htmlFor="reviewer">
              Reviewer
            </label>
            <input
              className={fieldClassName}
              id="reviewer"
              onChange={(event) => {
                setPersonQuery(event.target.value);
                setSelectedPerson(null);
              }}
              placeholder="Search by name or email"
              value={selectedPerson?.displayName ?? personQuery}
            />
            {searching ? (
              <p className="text-xs text-muted-foreground">Searching…</p>
            ) : null}
            {!selectedPerson && people.length > 0 ? (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-foreground bg-background">
                {people.map((person) => (
                  <button
                    className="block w-full border-b border-foreground px-3 py-2 text-left last:border-b-0 hover:bg-foreground hover:text-background"
                    key={person.id}
                    onClick={() => {
                      setSelectedPerson(person);
                      setPeople([]);
                    }}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">
                      {person.displayName}
                    </span>
                    {(person.affiliation ?? person.headline) ? (
                      <span className="block text-xs opacity-70">
                        {person.affiliation ?? person.headline}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-semibold">
              What should they check?
            </span>
            <textarea
              className={fieldClassName}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Describe the questions this reviewer should answer."
              rows={3}
              value={instructions}
            />
          </label>

          <div className="md:col-span-2">
            <button
              className={primaryButtonClassName}
              disabled={
                isBusy ||
                !selectedPerson ||
                !documentRevisionId ||
                !instructions.trim()
              }
              onClick={() => void runAction("request", requestReview)}
              type="button"
            >
              {busyKey === "request" ? "Assigning…" : "Assign review"}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-4 border border-foreground p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {panel.reviews.length > 0 ? (
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold">Reviews</h3>
          <p className="text-sm text-muted-foreground">
            These decisions only choose the working text inside Optimitron. They
            do not sign, file, enact, or publish the document.
          </p>
          {panel.reviews.map((review) => {
            const decided = panel.decisions.find(
              ({ decision }) =>
                decision.target.revisionId === review.target.revisionId,
            );
            return (
              <article
                className="border-t border-foreground pt-4"
                key={review.reviewTaskId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {review.reviewer.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {review.target.title} · version {review.target.version}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    {stateLabels[review.state]}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  {review.request.instructions}
                </p>
                {review.response ? (
                  <div className="mt-3 border-l border-foreground pl-3 text-sm">
                    <p className="font-semibold">
                      {verdictLabels[review.response.verdict]}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {review.response.explanation}
                    </p>
                  </div>
                ) : null}

                {decided ? (
                  <p className="mt-3 text-sm font-semibold">
                    Internal decision: {decided.decision.action.toLowerCase()}ed
                  </p>
                ) : review.response && review.state !== "STALE" ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    {review.response.verdict === "APPROVE" ? (
                      <button
                        className={primaryButtonClassName}
                        disabled={isBusy}
                        onClick={() =>
                          void runAction(`adopt-${review.reviewTaskId}`, () =>
                            decide("ADOPT", review),
                          )
                        }
                        type="button"
                      >
                        Use version {review.target.version} as working text
                      </button>
                    ) : null}
                    <label className="min-w-0 flex-1 space-y-1">
                      <span className="text-sm font-semibold">
                        Reason to reject
                      </span>
                      <input
                        className={fieldClassName}
                        onChange={(event) =>
                          setRejectReasons((current) => ({
                            ...current,
                            [review.reviewTaskId]: event.target.value,
                          }))
                        }
                        placeholder="Why should this version stop here?"
                        value={rejectReasons[review.reviewTaskId] ?? ""}
                      />
                    </label>
                    <button
                      className={secondaryButtonClassName}
                      disabled={isBusy}
                      onClick={() =>
                        void runAction(`reject-${review.reviewTaskId}`, () =>
                          decide("REJECT", review),
                        )
                      }
                      type="button"
                    >
                      Reject version
                    </button>
                  </div>
                ) : null}

                <details className="mt-3 text-xs text-muted-foreground">
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
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
