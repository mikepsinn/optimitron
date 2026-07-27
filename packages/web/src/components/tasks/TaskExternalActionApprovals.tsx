import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import {
  approveTaskExternalActionBatch,
  decideTaskExternalAction,
} from "@/app/tasks/[id]/actions";
import { Button } from "@/components/retroui/Button";
import { IntegrityProof } from "@/components/ui/integrity-proof";
import { OutboundMessageApprovalPayloadSchema } from "@/lib/email/outbound-message-approval.server";
import {
  getPrivateReviewApprovalContext,
  type PrivateReviewInvitationApprovalContext,
} from "@/lib/tasks/private-review-invitation-contracts";

export type ApprovableStatus =
  | typeof ExternalActionRequestStatus.PENDING
  | typeof ExternalActionRequestStatus.APPROVED;

export interface TaskExternalActionApproval {
  expiresAt: Date;
  failureMessage?: string | null;
  id: string;
  payloadHash: string;
  payloadJson: unknown;
  status: ApprovableStatus;
}

export function readOutboundEnvelopeV2(payload: unknown) {
  const parsed = OutboundMessageApprovalPayloadSchema.safeParse(payload);
  if (!parsed.success) return null;
  const { communicationId, emailLogId, envelope } = parsed.data;

  return {
    bcc: envelope.bcc ?? [],
    communicationId,
    emailLogId,
    from: envelope.from,
    headers: envelope.headers ?? {},
    html: envelope.html,
    replyTo: envelope.replyTo ?? null,
    subject: envelope.subject,
    text: envelope.text,
    to: envelope.to,
  };
}

export function readPrivateReviewApprovalContext(payload: unknown) {
  const parsed = OutboundMessageApprovalPayloadSchema.safeParse(payload);
  if (!parsed.success) return null;
  return getPrivateReviewApprovalContext(parsed.data.approvalContext);
}

const PREVIEW_CSP =
  "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; base-uri 'none'; form-action 'none'; img-src data: cid:; style-src 'unsafe-inline'\">";

export function buildNetworkBlockedHtmlPreview(html: string) {
  const inertHtml = html
    .replace(
      /<meta\b(?=[^>]*\bhttp-equiv\s*=\s*(?:"\s*refresh\s*"|'\s*refresh\s*'|refresh\b))[^>]*>/giu,
      "",
    )
    .replace(
      /\s(href|xlink:href|action)\s*=/giu,
      (_match, attribute: string) =>
        ` data-preview-${attribute.toLowerCase().replace(":", "-")}=`,
    );
  if (/<head(?:\s[^>]*)?>/i.test(inertHtml)) {
    return inertHtml.replace(
      /<head(\s[^>]*)?>/i,
      (head) => `${head}${PREVIEW_CSP}`,
    );
  }
  if (/<html(?:\s[^>]*)?>/i.test(inertHtml)) {
    return inertHtml.replace(
      /<html(\s[^>]*)?>/i,
      (root) => `${root}<head>${PREVIEW_CSP}</head>`,
    );
  }
  return `<!doctype html><html><head>${PREVIEW_CSP}</head><body>${inertHtml}</body></html>`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold">{value}</dd>
    </div>
  );
}

function DecisionForm({
  decision,
  id,
  label,
  primary = false,
}: {
  decision: "APPROVE" | "REJECT" | "RETRY";
  id: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={decideTaskExternalAction} className="sm:flex-1">
      <input name="externalActionRequestId" type="hidden" value={id} />
      <input name="decision" type="hidden" value={decision} />
      <Button
        className={`w-full border border-foreground px-4 py-2 text-xs font-black uppercase ${
          primary
            ? "bg-foreground text-background"
            : "bg-background text-foreground"
        }`}
        size="sm"
        type="submit"
        variant="outline"
      >
        {label}
      </Button>
    </form>
  );
}

function retryExplanation(failureMessage?: string | null) {
  const reason = failureMessage
    ?.replace(/^retryable:/, "")
    .replace(/^suppressed:/, "");
  if (reason === "manual_reconciliation_required") {
    return "Delivery could not be confirmed. Check the email provider; do not retry this request automatically.";
  }
  if (reason === "concurrent_idempotent_requests") {
    return "Another send attempt was still running. Retrying uses the same email and delivery key.";
  }
  if (reason === "outbound_mode_off") {
    return "Outbound email is paused. Retry after it is turned back on.";
  }
  if (reason === "recipient_not_allowlisted") {
    return "The recipient is outside the current email allowlist.";
  }
  return "The email provider did not confirm delivery. Retrying uses the same email and delivery key.";
}

function ApprovalCard({
  approval,
  batchManaged = false,
  reviewContext,
}: {
  approval: TaskExternalActionApproval;
  batchManaged?: boolean;
  reviewContext?: PrivateReviewInvitationApprovalContext | null;
}) {
  const envelope = readOutboundEnvelopeV2(approval.payloadJson);
  const isPending = approval.status === ExternalActionRequestStatus.PENDING;
  const requiresReconciliation =
    approval.failureMessage === "retryable:manual_reconciliation_required";
  const headerEntries = envelope ? Object.entries(envelope.headers) : [];

  return (
    <article className="border border-foreground p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em]">
            {isPending ? "Waiting for approval" : "Approved, but not sent"}
          </p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            Expires {formatDate(approval.expiresAt)}
          </p>
        </div>
      </div>

      {!isPending ? (
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          {retryExplanation(approval.failureMessage)}
        </p>
      ) : null}

      {envelope ? (
        <>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="From" value={envelope.from} />
            <Field label="To" value={envelope.to.join(", ")} />
            <Field
              label="BCC"
              value={envelope.bcc.length > 0 ? envelope.bcc.join(", ") : "None"}
            />
            <Field label="Reply-To" value={envelope.replyTo ?? "None"} />
          </dl>

          <div className="mt-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Subject
            </p>
            <p className="mt-1 break-words text-sm font-bold">
              {envelope.subject}
            </p>
          </div>

          {reviewContext ? (
            <dl className="mt-4 border-t border-foreground pt-3">
              <Field
                label="Document version"
                value={`Version ${reviewContext.revision.documentVersion} · exact text for this review`}
              />
            </dl>
          ) : null}

          {reviewContext ? (
            <IntegrityProof
              className="mt-4"
              items={[
                { label: "Review task ID", value: reviewContext.taskId },
                {
                  label: "Document ID",
                  value: reviewContext.revision.documentId,
                },
                {
                  label: "Revision ID",
                  value: reviewContext.revision.documentRevisionId,
                },
                {
                  label: "Revision hash",
                  value: reviewContext.revision.contentHash,
                },
                { label: "Payload hash", value: approval.payloadHash },
              ]}
            />
          ) : null}

          <details className="mt-4 border-t border-foreground pt-3">
            <summary className="cursor-pointer text-xs font-black uppercase underline underline-offset-4">
              Headers ({headerEntries.length})
            </summary>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap border border-foreground p-3 text-xs">
              {headerEntries.length > 0
                ? headerEntries
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\n")
                : "None"}
            </pre>
          </details>

          <details
            className="mt-3 border-t border-foreground pt-3"
            open={!envelope.html}
          >
            <summary className="cursor-pointer text-xs font-black uppercase underline underline-offset-4">
              Plain-text fallback
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap border border-foreground p-3 text-xs">
              {envelope.text}
            </pre>
          </details>

          <details
            className="mt-3 border-t border-foreground pt-3"
            open={Boolean(envelope.html) && !batchManaged}
          >
            <summary className="cursor-pointer text-xs font-black uppercase underline underline-offset-4">
              HTML preview
            </summary>
            {envelope.html ? (
              <iframe
                className="mt-3 h-96 w-full border border-foreground bg-white"
                referrerPolicy="no-referrer"
                sandbox=""
                srcDoc={buildNetworkBlockedHtmlPreview(envelope.html)}
                title={`HTML preview for ${envelope.subject}`}
              />
            ) : (
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Missing
              </p>
            )}
          </details>
        </>
      ) : (
        <p className="mt-4 border border-foreground p-3 text-sm font-bold">
          This email is missing the details needed for review.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {batchManaged ? (
          <>
            <p className="flex-1 text-xs font-semibold text-muted-foreground">
              This invitation can only be approved with every message in its
              frozen batch.
            </p>
            {isPending ? (
              <DecisionForm
                decision="REJECT"
                id={approval.id}
                label="Reject this email"
              />
            ) : null}
          </>
        ) : !envelope ? (
          isPending ? (
            <DecisionForm decision="REJECT" id={approval.id} label="Reject" />
          ) : null
        ) : isPending ? (
          <>
            <DecisionForm
              decision="APPROVE"
              id={approval.id}
              label="Approve and send"
              primary
            />
            <DecisionForm decision="REJECT" id={approval.id} label="Reject" />
          </>
        ) : requiresReconciliation ? null : (
          <DecisionForm
            decision="RETRY"
            id={approval.id}
            label="Retry send"
            primary
          />
        )}
      </div>
    </article>
  );
}

interface ReviewApprovalBatch {
  approvals: Array<{
    approval: TaskExternalActionApproval;
    context: PrivateReviewInvitationApprovalContext;
  }>;
  batchKey: string;
}

function ReviewBatchApproval({
  authorityTaskId,
  batch,
}: {
  authorityTaskId: string;
  batch: ReviewApprovalBatch;
}) {
  return (
    <section className="border border-foreground p-4">
      <h3 className="text-sm font-semibold">
        Review invitation batch ({batch.approvals.length})
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Every recipient, message, task, and document version is frozen. Approval
        fails if anything changed or is missing.
      </p>
      <div className="mt-4 space-y-4">
        {batch.approvals.map(({ approval, context }) => (
          <ApprovalCard
            approval={approval}
            batchManaged
            key={approval.id}
            reviewContext={context}
          />
        ))}
      </div>
      <form action={approveTaskExternalActionBatch} className="mt-4">
        <input name="authorityTaskId" type="hidden" value={authorityTaskId} />
        <input name="batchKey" type="hidden" value={batch.batchKey} />
        {batch.approvals.map(({ approval }) => (
          <span key={approval.id}>
            <input
              name="externalActionRequestId"
              type="hidden"
              value={approval.id}
            />
            <input
              name="expectedPayloadHash"
              type="hidden"
              value={approval.payloadHash}
            />
          </span>
        ))}
        <Button
          className="w-full rounded-none border border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase text-background sm:w-auto"
          type="submit"
          variant="outline"
        >
          Approve and send entire batch
        </Button>
      </form>
    </section>
  );
}

export function TaskExternalActionApprovals({
  approvals,
  authorityTaskId,
}: {
  approvals: TaskExternalActionApproval[];
  authorityTaskId: string;
}) {
  if (approvals.length === 0) return null;

  const reviewBatches = new Map<string, ReviewApprovalBatch>();
  const standaloneApprovals: Array<{
    approval: TaskExternalActionApproval;
    context: PrivateReviewInvitationApprovalContext | null;
  }> = [];
  for (const approval of approvals) {
    const context = readPrivateReviewApprovalContext(approval.payloadJson);
    if (approval.status !== ExternalActionRequestStatus.PENDING || !context) {
      standaloneApprovals.push({ approval, context });
      continue;
    }
    const batch = reviewBatches.get(context.batchKey) ?? {
      approvals: [],
      batchKey: context.batchKey,
    };
    batch.approvals.push({ approval, context });
    reviewBatches.set(context.batchKey, batch);
  }

  return (
    <section
      aria-labelledby="outbound-approvals-heading"
      className="border-b border-foreground py-6"
      id="outbound-approvals"
    >
      <div className="mb-4">
        <h2 id="outbound-approvals-heading" className="text-base font-semibold">
          Review email ({approvals.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check exactly who gets what before it leaves.
        </p>
      </div>
      <div className="space-y-4">
        {[...reviewBatches.values()].map((batch) => (
          <ReviewBatchApproval
            authorityTaskId={authorityTaskId}
            batch={batch}
            key={batch.batchKey}
          />
        ))}
        {standaloneApprovals.map(({ approval, context }) => (
          <ApprovalCard
            approval={approval}
            key={approval.id}
            reviewContext={context}
          />
        ))}
      </div>
    </section>
  );
}
