"use client";

import * as React from "react";
import { Clipboard } from "lucide-react";
import {
  createHumanityManagerStatus,
  type HumanityManagerStatusCompletedEmployee,
  type HumanityManagerStatusInput,
  type HumanityManagerStatusReminder,
} from "@/lib/humanity-manager-status-content";
import { copyTextToClipboard } from "@/lib/clipboard";

function StatusSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-5 text-[var(--treaty-ink)] shadow-none sm:p-6">
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
      {children}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function Text({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <p
      className={`mt-4 text-sm font-bold leading-6 sm:text-base ${
        muted ? "text-[var(--treaty-ink-muted)]" : ""
      }`}
    >
      {children}
    </p>
  );
}

function MetricTable({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="mt-5 grid grid-cols-1 border border-[var(--treaty-ink)] sm:grid-cols-5">
      {rows.map((row) => (
        <div
          className="border-b border-[var(--treaty-ink)] p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          key={row.label}
        >
          <dt className="text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-[var(--treaty-ink-muted)]">
            {row.label}
          </dt>
          <dd className="mt-2 text-2xl font-black leading-none">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatMaybeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function CompletedEmployees({
  employees,
  total,
}: {
  employees: HumanityManagerStatusCompletedEmployee[];
  total: number;
}) {
  if (employees.length === 0) {
    return (
      <p className="mt-5 border-t border-[var(--treaty-ink)]/30 pt-4 text-sm font-bold leading-6 text-[var(--treaty-ink-muted)]">
        No employees have completed the task through your named invitations yet.
      </p>
    );
  }

  const extra = total > employees.length ? total - employees.length : 0;

  return (
    <div className="mt-5 border-t border-[var(--treaty-ink)]/30 pt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">
        Employees who did the task
      </p>
      <ul className="mt-3 space-y-2 text-sm font-bold leading-6">
        {employees.slice(0, 8).map((person) => {
          const date = formatMaybeDate(person.completedAt);
          const downstreamVotes = Math.max(
            0,
            Math.floor(person.downstreamConversionCount),
          );
          const downstreamLabel =
            downstreamVotes === 1
              ? "1 downstream vote"
              : `${downstreamVotes.toLocaleString("en-US")} downstream votes`;
          return (
            <li key={`${person.displayName}-${date ?? "completed"}`}>
              <span className="font-black">{person.displayName}</span>
              {date ? ` voted YES on ${date}` : " voted YES"}
              <span className="text-[var(--treaty-ink-muted)]">
                {`; ${downstreamLabel} from them.`}
              </span>
            </li>
          );
        })}
      </ul>
      {extra > 0 ? (
        <p className="mt-2 text-sm font-bold text-[var(--treaty-ink-muted)]">
          Plus {extra.toLocaleString("en-US")} more.
        </p>
      ) : null}
    </div>
  );
}

function ReminderBlock({
  reminders,
}: {
  reminders: HumanityManagerStatusReminder[];
}) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  async function copyReminder(reminder: HumanityManagerStatusReminder) {
    await copyTextToClipboard(reminder.message);
    setCopiedId(reminder.id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === reminder.id ? null : current));
    }, 1500);
  }

  return (
    <div className="mt-5 border-t border-[var(--treaty-ink)]/30 pt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">
        Copy reminders
      </p>
      <div className="mt-3 space-y-3">
        {reminders.map((reminder) => (
          <div
            className="border border-[var(--treaty-ink)] p-3"
            key={reminder.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink-muted)]">
                  {reminder.title}
                </p>
                <p className="text-sm font-black leading-6">
                  {reminder.label}
                </p>
              </div>
              <button
                aria-label={`Copy reminder for ${reminder.label}`}
                className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-paper)] hover:bg-transparent hover:text-[var(--treaty-ink)]"
                onClick={() => void copyReminder(reminder)}
                type="button"
              >
                <Clipboard className="h-4 w-4" aria-hidden="true" />
                {copiedId === reminder.id ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words border-t border-[var(--treaty-ink)]/30 pt-3 text-xs font-bold leading-5 [font-family:var(--font-geist-mono,ui-monospace,SFMono-Regular,Menlo,monospace)]">
              {reminder.message}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

const HumanityManagerStatusWeb = createHumanityManagerStatus({
  CompletedEmployees,
  Eyebrow,
  Heading,
  MetricTable,
  ReminderBlock,
  Section: StatusSection,
  Text,
});

export function HumanityManagerStatus({
  input,
}: {
  input: HumanityManagerStatusInput;
}) {
  return <HumanityManagerStatusWeb input={input} />;
}
