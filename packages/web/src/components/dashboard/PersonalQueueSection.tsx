import Link from "next/link";
import { getTaskPath } from "@/lib/routes";
import { ExpectedValueExplainer } from "@/components/shared/ExpectedValueExplainer";
import {
  deadlineChip,
  formatPriority,
  summarizeIssueSeverities,
  type PersonalQueueDisplayData,
} from "./personal-queue-display";

// Renders the personal queue in the exact order loadPersonalQueue returns it
// — the same rows and ordering the MCP getMyQueue tool serves.
export function PersonalQueueSection({
  queue,
}: {
  queue: PersonalQueueDisplayData;
}) {
  const { buybackRate, issues, rows } = queue;
  const severitySummary = summarizeIssueSeverities(issues);

  return (
    <section className="mb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2 className="text-base font-semibold uppercase tracking-wide">
          What next
        </h2>
        <p className="text-xs text-[var(--treaty-ink-muted)]">
          Ranked by{" "}
          <ExpectedValueExplainer>expected value</ExpectedValueExplainer> per
          hour at ${buybackRate.toLocaleString()}
          /hr. Required deadlines override the ranking.
        </p>
      </div>

      {issues.length > 0 ? (
        <details className="mt-3 border border-[var(--treaty-ink)]/40 px-3 py-2">
          <summary className="cursor-pointer text-[13px] font-semibold">
            {issues.length} data issue{issues.length === 1 ? "" : "s"} affect
            this ranking
            {severitySummary ? (
              <span className="ml-2 font-normal text-[var(--treaty-ink-muted)]">
                {severitySummary}
              </span>
            ) : null}
          </summary>
          <ul className="mt-2 space-y-1.5">
            {issues.map((issue, index) => (
              <li
                key={`${issue.code}-${issue.taskId ?? index}`}
                className="text-xs leading-snug"
              >
                <span className="font-mono font-semibold uppercase">
                  {issue.severity}
                </span>{" "}
                {issue.message}
                {issue.taskId ? (
                  <>
                    {" "}
                    <Link
                      className="underline underline-offset-2"
                      href={getTaskPath(issue.taskId)}
                    >
                      View task
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--treaty-ink-muted)]">
          Nothing is executable right now — every active task is blocked or
          missing the estimates ranking needs.
        </p>
      ) : (
        <ol className="mt-3">
          {rows.map((row, index) => {
            const chip = deadlineChip(row);
            return (
              <li
                key={row.id}
                className="border-b border-[var(--treaty-ink)]/15 py-2"
              >
                <div className="flex items-baseline gap-2">
                  <span className="w-5 shrink-0 text-right text-[13px] font-semibold tabular-nums text-[var(--treaty-ink-muted)]">
                    {index + 1}.
                  </span>
                  <Link
                    className="min-w-0 flex-1 text-[15px] font-medium leading-snug underline-offset-4 hover:underline"
                    href={getTaskPath(row.id)}
                  >
                    {row.title}
                  </Link>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-7">
                  <span className="text-xs font-semibold tabular-nums">
                    {formatPriority(row.priority)}
                  </span>
                  {chip ? (
                    <span
                      className={
                        chip.urgent
                          ? "bg-[var(--treaty-ink)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[var(--treaty-paper)]"
                          : "border border-[var(--treaty-ink)]/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide"
                      }
                    >
                      {chip.label}
                    </span>
                  ) : null}
                  <details className="min-w-0">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-[0.1em] text-[var(--treaty-ink-muted)]">
                      Why this rank
                    </summary>
                    <p className="mt-1 break-words font-mono text-xs leading-relaxed">
                      {row.evMath}
                    </p>
                    {row.blockersCount > 0 ? (
                      <p className="mt-1 text-xs text-[var(--treaty-ink-muted)]">
                        Blockers resolved: {row.blockersResolved}/
                        {row.blockersCount}
                      </p>
                    ) : null}
                  </details>
                </div>
                {chip?.urgent && row.deadlineRationale ? (
                  <p className="mt-1 pl-7 text-xs text-[var(--treaty-ink-muted)]">
                    {row.deadlineRationale}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
