"use client"

import { useMemo, useState } from "react"
import { getFlagEmoji } from "../../lib/geo"
import { optimitronUrl } from "../../lib/optimitron-links"
import { formatDelayDuration } from "../../lib/tasks/accountability"
import type { TreatySignerTask } from "../../lib/tasks/treaty-signers"
import { useHydratedNow } from "../../lib/use-hydrated-now"

const DAY_MS = 1000 * 60 * 60 * 24
const DEFAULT_PAGE_SIZE = 10

interface OverdueSignerListProps {
  pageSize?: number
  /**
   * `Date.now()` at render time on the server.
   *
   * The client's first render has to agree with the server's markup or React
   * throws away the tree, so both use this timestamp; `useHydratedNow` swaps in
   * the visitor's real clock on the next tick. Passing the instant rather than
   * a precomputed count means the rows and the heading are derived the same way
   * before and after hydration.
   */
  serverNowMs: number
  signerTasks: TreatySignerTask[]
}

/**
 * The roster of heads of government who have not signed.
 *
 * This is deliberately a list and not Optimitron's task table: no per-row
 * share dialog, no live death/dollar counters. The counters recompute on a
 * timer, which makes every screenshot of the page differ from the last one and
 * is the exact instability the visual-review harness keeps flagging. The
 * composer above this list is the one place a visitor sends a reminder from,
 * so a second per-row remind button would only split the call to action.
 */
export function OverdueSignerList({
  pageSize = DEFAULT_PAGE_SIZE,
  serverNowMs,
  signerTasks,
}: OverdueSignerListProps) {
  const hydratedNow = useHydratedNow()
  const [page, setPage] = useState(0)

  const referenceMs = hydratedNow ? hydratedNow.getTime() : serverNowMs

  const rows = useMemo(
    () =>
      signerTasks.map((task) => {
        const dueMs = task.dueAt ? new Date(task.dueAt).getTime() : null
        const overdueDays =
          dueMs == null ? null : Math.max(0, (referenceMs - dueMs) / DAY_MS)
        return { overdueDays, task }
      }),
    [referenceMs, signerTasks],
  )

  const overdueCount = rows.filter((row) => (row.overdueDays ?? 0) > 0).length

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const clampedPage = Math.min(page, pageCount - 1)
  const visible = rows.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize)

  return (
    <section className="space-y-3" data-visual-section="president-task-list">
      <h2 className="text-lg font-black uppercase tracking-[0.08em]">
        {overdueCount > 0 ? (
          <>
            ↳ <span data-volatile="overdue-employee-count">{overdueCount}</span>{" "}
            employees have overdue tasks
          </>
        ) : (
          "Treaty signatories"
        )}
      </h2>

      <ul className="divide-y-2 divide-foreground border-4 border-foreground">
        {visible.map(({ overdueDays, task }) => (
          <li
            key={task.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
          >
            <a
              className="text-sm font-black uppercase underline decoration-2 underline-offset-2"
              href={optimitronUrl(`/tasks/${task.id}`)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {task.assigneeCountryCode
                ? `${getFlagEmoji(task.assigneeCountryCode)} `
                : ""}
              {task.assigneeName ?? task.title}
            </a>
            <span
              className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground"
              data-volatile="signer-overdue-duration"
            >
              {overdueDays == null
                ? "no due date"
                : overdueDays > 0
                  ? `${formatDelayDuration(overdueDays)} overdue`
                  : "on time"}
            </span>
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            className="border-2 border-foreground px-3 py-1 text-[11px] font-black uppercase disabled:opacity-40"
            disabled={clampedPage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            type="button"
          >
            ← Prev
          </button>
          <span className="text-[11px] font-black uppercase tracking-[0.14em]">
            Page {clampedPage + 1} / {pageCount}
          </span>
          <button
            className="border-2 border-foreground px-3 py-1 text-[11px] font-black uppercase disabled:opacity-40"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            type="button"
          >
            Next →
          </button>
        </div>
      ) : null}
    </section>
  )
}
