import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import { decideTaskExternalAction } from "@/app/tasks/[id]/actions";
import { Button } from "@/components/retroui/Button";
import { OutboundMessageApprovalPayloadSchema } from "@/lib/email/outbound-message-approval.server";

export type ApprovableStatus =
  | typeof ExternalActionRequestStatus.PENDING
  | typeof ExternalActionRequestStatus.APPROVED;

export interface TaskExternalActionApproval {
  expiresAt: Date;
  failureMessage?: string | null;
  id: string;
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

function ApprovalCard({ approval }: { approval: TaskExternalActionApproval }) {
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
            open={Boolean(envelope.html)}
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
        {!envelope ? (
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

export function TaskExternalActionApprovals({
  approvals,
}: {
  approvals: TaskExternalActionApproval[];
}) {
  if (approvals.length === 0) return null;

  return (
    <section
      aria-labelledby="outbound-approvals-heading"
      className="border-b border-foreground py-6"
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
        {approvals.map((approval) => (
          <ApprovalCard approval={approval} key={approval.id} />
        ))}
      </div>
    </section>
  );
}
