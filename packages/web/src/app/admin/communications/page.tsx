import { TaskCommunicationStatus } from "@optimitron/db/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  clampAdminLimit,
  listAdminCommunicationDirectory,
  listAdminEmailLogs,
  listAdminTaskEmailCommunications,
  listPendingOutboundApprovals,
  type AdminCommunicationFilters,
  type PendingOutboundApproval,
} from "@/lib/admin-communications.server";
import { getCurrentUser } from "@/lib/auth-utils";
import { decideOutboundMessage } from "./actions";

export const dynamic = "force-dynamic";

interface AdminCommunicationsSearchParams {
  email?: string;
  limit?: string;
  organizationId?: string;
  personId?: string;
  q?: string;
  status?: string;
  taskId?: string;
  userId?: string;
}

const FILTERABLE_STATUSES = [
  TaskCommunicationStatus.DRAFT,
  TaskCommunicationStatus.FAILED,
  TaskCommunicationStatus.CANCELLED,
  TaskCommunicationStatus.SENT,
] as const;

function parseStatus(value?: string): TaskCommunicationStatus | null {
  const candidate = value?.trim().toUpperCase();
  return (
    FILTERABLE_STATUSES.find((status) => status === candidate) ?? null
  );
}

function clean(value?: string | null) {
  return value?.trim() || "";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getLimit(value?: string) {
  const parsed = value ? Number(value) : undefined;
  return clampAdminLimit(parsed, 50, 200);
}

function getFilters(
  params: AdminCommunicationsSearchParams,
): AdminCommunicationFilters {
  return {
    email: clean(params.email) || null,
    limit: getLimit(params.limit),
    organizationId: clean(params.organizationId) || null,
    personId: clean(params.personId) || null,
    q: clean(params.q) || null,
    status: parseStatus(params.status),
    taskId: clean(params.taskId) || null,
    userId: clean(params.userId) || null,
  };
}

function statusClass(status: string) {
  if (status === "SENT" || status === "DELIVERED" || status === "RECEIVED") {
    return "bg-foreground text-background";
  }
  if (status === "FAILED" || status === "BOUNCED") {
    return "bg-background text-foreground";
  }
  return "bg-muted text-foreground";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex border border-foreground px-2 py-0.5 text-[10px] font-black uppercase ${statusClass(
        status,
      )}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function EmptyRow({
  colSpan,
  children,
}: {
  children: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border-b border-foreground p-4 text-sm font-bold text-muted-foreground"
      >
        {children}
      </td>
    </tr>
  );
}

function PendingApprovalCard({
  approval,
}: {
  approval: PendingOutboundApproval;
}) {
  return (
    <article className="border-2 border-foreground p-4 text-sm font-bold">
      <div className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">
        To
      </div>
      <div className="break-all text-base">{approval.recipientEmail}</div>

      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">
        Subject
      </div>
      <div className="text-base">{approval.subject ?? "(no subject)"}</div>

      <div className="mt-3 text-xs text-muted-foreground">
        <Link href={`/tasks/${approval.taskId}`} className="underline">
          {approval.taskTitle}
        </Link>
        {approval.taskKey ? ` / ${approval.taskKey}` : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Drafted {formatDate(approval.createdAt)} / expires{" "}
        {formatDate(approval.expiresAt)}
      </div>

      {approval.text ? (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-black uppercase underline">
            Full message
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-foreground bg-background p-3 font-mono text-[11px] font-bold">
            {approval.text}
          </pre>
        </details>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <form action={decideOutboundMessage} className="sm:flex-1">
          <input
            type="hidden"
            name="externalActionRequestId"
            value={approval.id}
          />
          <input type="hidden" name="decision" value="APPROVE" />
          <button
            type="submit"
            className="w-full border-2 border-foreground bg-foreground px-4 py-3 text-xs font-black uppercase text-background"
          >
            Approve and send
          </button>
        </form>
        <form action={decideOutboundMessage} className="sm:flex-1">
          <input
            type="hidden"
            name="externalActionRequestId"
            value={approval.id}
          />
          <input type="hidden" name="decision" value="REJECT" />
          <button
            type="submit"
            className="w-full border-2 border-foreground px-4 py-3 text-xs font-black uppercase"
          >
            Reject
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function AdminCommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<AdminCommunicationsSearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/admin/communications");
  if (!user.isAdmin) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Admin only</h1>
      </section>
    );
  }

  const params = await searchParams;
  const filters = getFilters(params);
  const [communications, emailLogs, directory, pendingApprovals] =
    await Promise.all([
      listAdminTaskEmailCommunications(filters),
      listAdminEmailLogs(filters),
      listAdminCommunicationDirectory({
        limit: filters.limit,
        q: filters.q,
      }),
      listPendingOutboundApprovals({ actorUserId: user.id }),
    ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8 flex flex-col gap-4 border-b-2 border-foreground pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-3xl font-black uppercase">
            Communications ledger
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
            Task emails, recipient history, and delivery logs. Search by task,
            email, user, person, or organization.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs font-black uppercase">
          <Link
            href="/admin/organizations"
            className="border-2 border-foreground px-3 py-2"
          >
            Organizations
          </Link>
          <Link
            href="/admin/referendum-positions"
            className="border-2 border-foreground px-3 py-2"
          >
            Positions
          </Link>
        </nav>
      </header>

      <form className="mb-10 grid gap-3 border-2 border-foreground p-4 text-sm font-bold md:grid-cols-6">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-black uppercase">
            Search
          </span>
          <input
            className="w-full border-2 border-foreground bg-background px-3 py-2"
            defaultValue={clean(params.q)}
            name="q"
            placeholder="Subject, recipient, task, organization"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase">Email</span>
          <input
            className="w-full border-2 border-foreground bg-background px-3 py-2"
            defaultValue={clean(params.email)}
            name="email"
            placeholder="person@example.org"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase">
            Task ID
          </span>
          <input
            className="w-full border-2 border-foreground bg-background px-3 py-2"
            defaultValue={clean(params.taskId)}
            name="taskId"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase">
            Status
          </span>
          <select
            className="w-full border-2 border-foreground bg-background px-3 py-2"
            defaultValue={filters.status ?? ""}
            name="status"
          >
            <option value="">Any</option>
            {FILTERABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase">Limit</span>
          <input
            className="w-full border-2 border-foreground bg-background px-3 py-2"
            defaultValue={String(filters.limit)}
            min={1}
            max={200}
            name="limit"
            type="number"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="border-2 border-foreground bg-foreground px-4 py-2 text-background"
          >
            Search
          </button>
          <Link href="/admin/communications" className="px-2 py-2 underline">
            Clear
          </Link>
        </div>
        <details className="md:col-span-6">
          <summary className="cursor-pointer text-xs font-black uppercase">
            ID filters
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-black uppercase">
                User ID
              </span>
              <input
                className="w-full border-2 border-foreground bg-background px-3 py-2"
                defaultValue={clean(params.userId)}
                name="userId"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase">
                Person ID
              </span>
              <input
                className="w-full border-2 border-foreground bg-background px-3 py-2"
                defaultValue={clean(params.personId)}
                name="personId"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase">
                Organization ID
              </span>
              <input
                className="w-full border-2 border-foreground bg-background px-3 py-2"
                defaultValue={clean(params.organizationId)}
                name="organizationId"
              />
            </label>
          </div>
        </details>
      </form>

      <div className="space-y-12">
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-black uppercase">Pending approval</h2>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {pendingApprovals.length} waiting
            </p>
          </div>
          {pendingApprovals.length === 0 ? (
            <div className="border-2 border-foreground p-4 text-sm font-bold text-muted-foreground">
              No messages are waiting. Anything an agent drafts lands here
              before it reaches a human.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingApprovals.map((approval) => (
                <PendingApprovalCard approval={approval} key={approval.id} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="text-xl font-black uppercase">Task emails</h2>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Showing {communications.communications.length} of{" "}
              {communications.total}
            </p>
          </div>
          <div className="space-y-3 md:hidden">
            {communications.communications.length === 0 ? (
              <div className="border-2 border-foreground p-4 text-sm font-bold text-muted-foreground">
                No task emails match this search.
              </div>
            ) : (
              communications.communications.map((communication) => (
                <article
                  key={communication.id}
                  className="border-2 border-foreground p-4 text-sm font-bold"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <StatusBadge status={communication.status} />
                      <div className="mt-1 text-[11px] uppercase text-muted-foreground">
                        {communication.purpose.toLowerCase()}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatDate(communication.sentAt)}
                    </div>
                  </div>
                  <div className="text-base">
                    {communication.subject ?? "-"}
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/tasks/${communication.taskId}`}
                      className="underline"
                    >
                      {communication.task.title}
                    </Link>
                  </div>
                  <div className="mt-2 break-all text-xs text-muted-foreground">
                    {communication.recipient.name ?? "-"} /{" "}
                    {communication.recipient.email ??
                      communication.emailLog?.toAddress ??
                      "-"}
                  </div>
                  {communication.messagePreview ? (
                    <p className="mt-3 text-xs font-bold text-muted-foreground">
                      {communication.messagePreview}
                    </p>
                  ) : null}
                  {communication.text ? (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer font-black uppercase underline">
                        Email text
                      </summary>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-foreground bg-background p-3 font-mono text-[11px] font-bold">
                        {communication.text}
                      </pre>
                    </details>
                  ) : null}
                  {communication.errorMessage ? (
                    <p className="mt-2 text-xs font-bold">
                      Error: {communication.errorMessage}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
          <div className="hidden overflow-x-auto border-2 border-foreground md:block">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="p-3">Status</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Task</th>
                  <th className="p-3">When</th>
                  <th className="p-3">Preview</th>
                </tr>
              </thead>
              <tbody>
                {communications.communications.length === 0 ? (
                  <EmptyRow colSpan={6}>
                    No task emails match this search.
                  </EmptyRow>
                ) : (
                  communications.communications.map((communication) => (
                    <tr
                      key={communication.id}
                      className="border-b border-foreground align-top"
                    >
                      <td className="p-3">
                        <StatusBadge status={communication.status} />
                        <div className="mt-2 text-[11px] font-bold uppercase text-muted-foreground">
                          {communication.purpose.toLowerCase()}
                        </div>
                      </td>
                      <td className="max-w-[220px] p-3 font-bold">
                        <div>{communication.recipient.name ?? "-"}</div>
                        <div className="break-all text-xs text-muted-foreground">
                          {communication.recipient.email ??
                            communication.emailLog?.toAddress ??
                            "-"}
                        </div>
                      </td>
                      <td className="max-w-[260px] p-3 font-bold">
                        {communication.subject ?? "-"}
                      </td>
                      <td className="max-w-[240px] p-3">
                        <Link
                          href={`/tasks/${communication.taskId}`}
                          className="font-bold underline"
                        >
                          {communication.task.title}
                        </Link>
                        <div className="break-all text-xs text-muted-foreground">
                          {communication.task.taskKey ?? communication.taskId}
                        </div>
                      </td>
                      <td className="p-3 text-xs font-bold text-muted-foreground">
                        <div>Sent {formatDate(communication.sentAt)}</div>
                        <div>Failed {formatDate(communication.failedAt)}</div>
                        <div>
                          Received {formatDate(communication.receivedAt)}
                        </div>
                      </td>
                      <td className="max-w-[320px] p-3 text-xs font-bold text-muted-foreground">
                        {communication.messagePreview ?? "-"}
                        {communication.text ? (
                          <details className="mt-2 text-foreground">
                            <summary className="cursor-pointer font-black uppercase underline">
                              Email text
                            </summary>
                            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap border border-foreground bg-background p-3 font-mono text-[11px] font-bold">
                              {communication.text}
                            </pre>
                          </details>
                        ) : null}
                        {communication.errorMessage ? (
                          <div className="mt-2 text-foreground">
                            Error: {communication.errorMessage}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="text-xl font-black uppercase">Email logs</h2>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Showing {emailLogs.emailLogs.length} of {emailLogs.total}
            </p>
          </div>
          <div className="space-y-3 md:hidden">
            {emailLogs.emailLogs.length === 0 ? (
              <div className="border-2 border-foreground p-4 text-sm font-bold text-muted-foreground">
                No email logs match this search.
              </div>
            ) : (
              emailLogs.emailLogs.map((log) => (
                <article
                  key={log.id}
                  className="border-2 border-foreground p-4 text-sm font-bold"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <StatusBadge status={log.status} />
                    <div className="text-right text-xs text-muted-foreground">
                      {formatDate(log.sentAt)}
                    </div>
                  </div>
                  <div className="text-base">{log.subject}</div>
                  <div className="mt-2 break-all text-xs text-muted-foreground">
                    {log.toAddress}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Template: {log.templateId ?? "-"}
                  </div>
                  {log.taskCommunications.length > 0 ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {log.taskCommunications.map((communication) => (
                        <div key={communication.id}>
                          Task:{" "}
                          <Link
                            href={`/tasks/${communication.taskId}`}
                            className="text-foreground underline"
                          >
                            {communication.task.title}
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          <div className="hidden overflow-x-auto border-2 border-foreground md:block">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="p-3">Status</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Delivery</th>
                  <th className="p-3">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.emailLogs.length === 0 ? (
                  <EmptyRow colSpan={6}>
                    No email logs match this search.
                  </EmptyRow>
                ) : (
                  emailLogs.emailLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-foreground align-top"
                    >
                      <td className="p-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="max-w-[220px] break-all p-3 font-bold">
                        {log.toAddress}
                        {log.user ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            User {log.user.id}
                          </div>
                        ) : null}
                      </td>
                      <td className="max-w-[260px] p-3 font-bold">
                        {log.subject}
                      </td>
                      <td className="max-w-[180px] break-all p-3 text-xs font-bold text-muted-foreground">
                        {log.templateId ?? "-"}
                      </td>
                      <td className="p-3 text-xs font-bold text-muted-foreground">
                        <div>Sent {formatDate(log.sentAt)}</div>
                        <div>Delivered {formatDate(log.deliveredAt)}</div>
                        <div>Opened {formatDate(log.openedAt)}</div>
                        <div>Bounced {formatDate(log.bouncedAt)}</div>
                      </td>
                      <td className="max-w-[240px] p-3 text-xs font-bold text-muted-foreground">
                        {log.taskCommunications.length === 0
                          ? "-"
                          : log.taskCommunications.map((communication) => (
                              <div key={communication.id}>
                                <Link
                                  href={`/tasks/${communication.taskId}`}
                                  className="text-foreground underline"
                                >
                                  {communication.task.title}
                                </Link>
                              </div>
                            ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div>
            <h2 className="mb-3 text-xl font-black uppercase">Users</h2>
            <ul className="space-y-2">
              {directory.users.map((directoryUser) => (
                <li
                  key={directoryUser.id}
                  className="border-2 border-foreground p-3 text-sm font-bold"
                >
                  <div className="break-all">{directoryUser.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {directoryUser.person?.displayName ?? "No person profile"}{" "}
                    {directoryUser.isAdmin ? "(admin)" : ""}
                  </div>
                  <div className="mt-2 text-xs uppercase text-muted-foreground">
                    {directoryUser._count.emailLogs} email logs /{" "}
                    {directoryUser._count.receivedTaskCommunications} received
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-black uppercase">People</h2>
            <ul className="space-y-2">
              {directory.people.map((person) => (
                <li
                  key={person.id}
                  className="border-2 border-foreground p-3 text-sm font-bold"
                >
                  <div>{person.displayName}</div>
                  <div className="break-all text-xs text-muted-foreground">
                    {person.email ?? person.user?.email ?? person.handle ?? "-"}
                  </div>
                  <div className="mt-2 text-xs uppercase text-muted-foreground">
                    {person._count.receivedTaskCommunications} received /{" "}
                    {person._count.sentTaskCommunications} sent
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-black uppercase">Organizations</h2>
            <ul className="space-y-2">
              {directory.organizations.map((organization) => (
                <li
                  key={organization.id}
                  className="border-2 border-foreground p-3 text-sm font-bold"
                >
                  <div>{organization.name}</div>
                  <div className="break-all text-xs text-muted-foreground">
                    {organization.contactEmail ?? organization.website ?? "-"}
                  </div>
                  <div className="mt-2 text-xs uppercase text-muted-foreground">
                    {organization._count.assignedTasks} assigned tasks /{" "}
                    {organization._count.receivedTaskCommunications} received
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}
