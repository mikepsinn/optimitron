import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards"
import { prisma } from "../prisma"
import {
  compareSignersByMilitarySpending,
  type TreatySignerTask,
} from "./treaty-signers"
import { TREATY_SIGNER_TASK_KEY_PREFIX } from "@optimitron/db/task-keys"

/**
 * Annual military spending for a signer's government, or `null` when the
 * dataset carries no report card for it. Used only to order the roster.
 */
function getMilitarySpending(countryCode: string | null): number | null {
  if (!countryCode) return null
  return getGovernmentMetrics(countryCode)?.militarySpendingAnnual.value ?? null
}

/**
 * Every treaty-signer task, most overdue first.
 *
 * `taskKey` is unique and every signer key shares one prefix, so this is a
 * single index range scan. Tasks with no due date sort last — an unscheduled
 * signature is not overdue, it is unscheduled — and the remaining ties break
 * on assignee name so the roster is stable across renders.
 */
export async function getTreatySignerTasks(): Promise<TreatySignerTask[]> {
  const rows = await prisma.task.findMany({
    where: { taskKey: { startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:` } },
    select: {
      id: true,
      title: true,
      dueAt: true,
      assigneePerson: { select: { countryCode: true, displayName: true } },
    },
    // Every signer task shares one due date and one title ("Sign the 1%
    // Treaty"), so the database cannot order them meaningfully — and with no
    // tiebreak the planner is free to reshuffle the roster between renders.
    // Name then id makes the query deterministic; the sort below then lifts
    // the governments that matter most to the top.
    orderBy: [
      { dueAt: "asc" },
      { assigneePerson: { displayName: "asc" } },
      { id: "asc" },
    ],
  })

  return rows
    .map((row) => ({
      assigneeCountryCode: row.assigneePerson?.countryCode ?? null,
      assigneeName: row.assigneePerson?.displayName ?? null,
      dueAt: row.dueAt,
      id: row.id,
      title: row.title,
    }))
    .sort((a, b) =>
      compareSignersByMilitarySpending(
        getMilitarySpending(a.assigneeCountryCode),
        getMilitarySpending(b.assigneeCountryCode),
      ),
    )
}
