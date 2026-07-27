"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IntegrityProof } from "@/components/ui/integrity-proof";
import { API_ROUTES } from "@/lib/api-routes";
import type { ContributionReceiptPanelData } from "@/lib/task-funding/contribution-receipt-ui.server";

const fieldClassName =
  "w-full rounded-none border border-foreground bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background";
const buttonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-none border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-60";

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currency.toUpperCase(),
    style: "currency",
  }).format(amountCents / 100);
}

function formatUtcDateTime(value: string) {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function ContributionReceiptPanel({
  data,
}: {
  data: ContributionReceiptPanelData;
}) {
  const router = useRouter();
  const addendumIdempotency = useRef<{
    fingerprint: string;
    key: string;
  } | null>(null);
  const { receipt } = data;
  const pinnedDocuments = [
    receipt.terms.termsDocument,
    ...receipt.governingDocuments.filter(
      (document) =>
        document.revisionId !== receipt.terms.termsDocument.revisionId,
    ),
  ];
  const [correctsArtifactId, setCorrectsArtifactId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [impactRealized, setImpactRealized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kind, setKind] = useState<
    "TASK_COMPLETED" | "IMPACT_OBSERVED" | "REFUND" | "CORRECTION"
  >("TASK_COMPLETED");
  const [observedAt, setObservedAt] = useState("");
  const [summary, setSummary] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);

  async function appendAddendum() {
    if (isSubmitting) return;
    setError(null);
    if (
      (kind === "IMPACT_OBSERVED" || impactRealized) &&
      !evidenceNote.trim() &&
      !evidenceUrl.trim()
    ) {
      setError("Observed impact needs an evidence URL or note.");
      return;
    }
    try {
      const evidence =
        evidenceNote.trim() || evidenceUrl.trim()
          ? [
              {
                ...(evidenceNote.trim() ? { note: evidenceNote.trim() } : {}),
                ...(evidenceUrl.trim()
                  ? { sourceUrl: evidenceUrl.trim() }
                  : {}),
              },
            ]
          : [];
      const taskCompletedForKind =
        kind === "TASK_COMPLETED"
          ? true
          : kind === "REFUND" || kind === "CORRECTION"
            ? false
            : taskCompleted;
      const bodyWithoutIdempotency = {
        ...(kind === "CORRECTION"
          ? { correctsArtifactId: correctsArtifactId.trim() }
          : {}),
        evidence,
        impactRealized,
        kind,
        observedAt: new Date(observedAt).toISOString(),
        paymentId: receipt.payment.paymentId,
        summary: summary.trim(),
        taskCompleted: taskCompletedForKind,
      };
      const fingerprint = JSON.stringify(bodyWithoutIdempotency);
      if (addendumIdempotency.current?.fingerprint !== fingerprint) {
        addendumIdempotency.current = {
          fingerprint,
          key: `receipt-addendum:${crypto.randomUUID()}`,
        };
      }
      const idempotencyKey = addendumIdempotency.current.key;
      setIsSubmitting(true);
      const response = await fetch(
        API_ROUTES.contributionReceipts.addenda(receipt.payment.paymentId),
        {
          body: JSON.stringify({
            ...bodyWithoutIdempotency,
            idempotencyKey,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not record the addendum.");
      }
      addendumIdempotency.current = null;
      setCorrectsArtifactId("");
      setEvidenceNote("");
      setEvidenceUrl("");
      setImpactRealized(false);
      setObservedAt("");
      setSummary("");
      setTaskCompleted(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not record the addendum.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="contribution-receipt-heading"
      className="border-b border-foreground py-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Immutable contribution receipt
      </p>
      <h2
        className="mt-2 text-xl font-semibold"
        id="contribution-receipt-heading"
      >
        {formatAmount(receipt.payment.amountCents, receipt.payment.currency)}{" "}
        for {receipt.intendedTask.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Paid {formatUtcDateTime(receipt.payment.paidAt)}
      </p>

      <dl className="mt-5 grid gap-3 border-y border-foreground py-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-semibold">Work complete</dt>
          <dd>{receipt.taskCompleted ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Impact realized</dt>
          <dd>{receipt.impactRealized ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="font-semibold">
            Earth Optimization Points (EOP) minted
          </dt>
          <dd>{receipt.eopMinted ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm font-semibold">
        This freezes what the contribution funded. It does not claim that the
        work or impact already happened.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Intended work</h3>
          <p className="mt-2 text-sm">
            <Link
              className="underline underline-offset-4"
              href={`/tasks/${receipt.intendedTask.id}`}
            >
              {receipt.intendedTask.title}
            </Link>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Payment status: {receipt.payment.status.toLowerCase()}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Pinned impact estimate</h3>
          <p className="mt-2 text-sm">
            {receipt.impactEstimate.methodologyKey} ·{" "}
            {receipt.impactEstimate.calculationVersion}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Pinned documents</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {pinnedDocuments.map((document) => (
            <li key={document.revisionId}>
              {document.title} · version {document.version}
            </li>
          ))}
        </ul>
        <IntegrityProof
          className="mt-3"
          items={[
            { label: "Receipt hash", value: data.contentHash },
            { label: "Payment ID", value: receipt.payment.paymentId },
            {
              label: "Impact parameter set",
              value: receipt.impactEstimate.parameterSetHash,
            },
            ...pinnedDocuments.flatMap((document) => [
              {
                label: `${document.title} revision ID`,
                value: document.revisionId,
              },
              {
                label: `${document.title} revision hash`,
                value: document.contentHash,
              },
            ]),
          ]}
        />
      </div>

      <div className="mt-6 border-t border-foreground pt-5">
        <h3 className="text-base font-semibold">
          Outcome addenda ({data.addenda.length})
        </h3>
        {data.addenda.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No later outcome, refund, or correction has been recorded.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {data.addenda.map((addendum) => (
              <li
                className="border border-foreground p-3 text-sm"
                key={addendum.artifactId}
              >
                <p className="font-semibold">
                  {addendum.kind.replaceAll("_", " ").toLowerCase()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{addendum.summary}</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  Observed {formatUtcDateTime(addendum.observedAt)} · work
                  complete {addendum.taskCompleted ? "yes" : "no"} · impact
                  realized {addendum.impactRealized ? "yes" : "no"} · EOP minted
                  no
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {data.canManage ? (
        <details className="mt-6 border border-foreground p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Append an outcome, refund, or correction
          </summary>
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void appendAddendum();
            }}
          >
            <label className="grid gap-2 text-sm font-semibold">
              <span>Kind</span>
              <select
                className={fieldClassName}
                onChange={(event) => setKind(event.target.value as typeof kind)}
                value={kind}
              >
                <option value="TASK_COMPLETED">Task completed</option>
                <option value="IMPACT_OBSERVED">Impact observed</option>
                <option value="REFUND">Refund</option>
                <option value="CORRECTION">Correction</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Observed at</span>
              <input
                className={fieldClassName}
                onChange={(event) => setObservedAt(event.target.value)}
                required
                type="datetime-local"
                value={observedAt}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Summary</span>
              <textarea
                className={fieldClassName}
                onChange={(event) => setSummary(event.target.value)}
                required
                rows={4}
                value={summary}
              />
            </label>
            {kind === "CORRECTION" ? (
              <label className="grid gap-2 text-sm font-semibold">
                <span>Artifact being corrected</span>
                <input
                  className={fieldClassName}
                  onChange={(event) =>
                    setCorrectsArtifactId(event.target.value)
                  }
                  required
                  value={correctsArtifactId}
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-semibold">
              <span>Evidence URL</span>
              <input
                className={fieldClassName}
                onChange={(event) => setEvidenceUrl(event.target.value)}
                type="url"
                value={evidenceUrl}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Evidence note</span>
              <textarea
                className={fieldClassName}
                onChange={(event) => setEvidenceNote(event.target.value)}
                rows={2}
                value={evidenceNote}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              For observed impact, add an evidence URL or note.
            </p>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                checked={
                  kind === "TASK_COMPLETED" ||
                  (kind === "IMPACT_OBSERVED" && taskCompleted)
                }
                disabled={
                  kind === "TASK_COMPLETED" ||
                  kind === "REFUND" ||
                  kind === "CORRECTION"
                }
                onChange={(event) => setTaskCompleted(event.target.checked)}
                type="checkbox"
              />
              Work is complete
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                checked={impactRealized}
                onChange={(event) => setImpactRealized(event.target.checked)}
                type="checkbox"
              />
              Impact has been observed
            </label>
            {error ? (
              <p className="text-sm font-semibold" role="alert">
                {error}
              </p>
            ) : null}
            <div>
              <button
                className={buttonClassName}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Recording…" : "Append immutable addendum"}
              </button>
            </div>
          </form>
        </details>
      ) : null}
    </section>
  );
}
