import Link from "next/link";
import { getTaskPath } from "@/lib/routes";
import {
  deadlineChip,
  formatPriority,
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

  return (
    <section className="mb-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2 className="text-xl font-black uppercase tracking-tight">
          What next
        </h2>
        <p className="text-xs text-[var(--treaty-ink-muted)]">
          Ranked by expected value per hour at ${buybackRate.toLocaleString()}
          /hr. Required deadlines override the ranking.
        </p>
      </div>

      {issues.length > 0 ? (
        <details className="mt-3 border border-[var(--treaty-ink)] px-3 py-2">
          <summary className="cursor-pointer text-sm font-bold">
            {issues.length} data issue{issues.length === 1 ? "" : "s"} affect
            this ranking
          </summary>
          <ul className="mt-2 space-y-1.5">
            {issues.map((issue, index) => (
              <li
                key={`${issue.code}-${issue.taskId ?? index}`}
                className="text-xs leading-snug"
              >
                <span className="font-mono font-bold uppercase">
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
        <ol className="mt-4">
          {rows.map((row, index) => {
            const chip = deadlineChip(row);
            return (
              <li
                key={row.id}
                className="border-b border-[var(--treaty-ink)]/20 py-2.5"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="w-6 shrink-0 text-right font-black tabular-nums">
                    {index + 1}.
                  </span>
                  <Link
                    className="min-w-0 flex-1 font-bold underline-offset-4 hover:underline"
                    href={getTaskPath(row.id)}
                  >
                    {row.title}
                  </Link>
                  {chip ? (
                    <span
                      className={
                        chip.urgent
                          ? "shrink-0 bg-[var(--treaty-ink)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[var(--treaty-paper)]"
                          : "shrink-0 border border-[var(--treaty-ink)] px-1.5 py-0.5 text-[10px] font-black uppercase"
                      }
                    >
                      {chip.label}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-sm font-bold tabular-nums">
                    {formatPriority(row.priority)}
                  </span>
                </div>
                {chip?.urgent && row.deadlineRationale ? (
                  <p className="mt-1 pl-9 text-xs text-[var(--treaty-ink-muted)]">
                    {row.deadlineRationale}
                  </p>
                ) : null}
                <details className="mt-1 pl-9">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-[var(--treaty-ink-muted)]">
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
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
