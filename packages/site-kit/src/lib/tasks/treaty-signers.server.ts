import { listGovernmentLeaders } from "@optimitron/data/datasets/government-leaders"
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards"
import { prisma } from "../prisma"
import { createLogger } from "../logger"
import {
  compareSignersByMilitarySpending,
  type TreatyPresidentManagementData,
  type TreatySignerTask,
} from "./treaty-signers"
import {
  TREATY_PARENT_TASK_ID,
  TREATY_PARENT_TASK_KEY,
  TREATY_SIGNER_TASK_KEY_PREFIX,
} from "@optimitron/db/task-keys"
import { TaskStatus } from "@optimitron/db"

const log = createLogger("treaty-signers")
const TREATY_PROGRAM_DUE_AT = new Date("2024-12-31T00:00:00.000Z")
const TREATY_SIGNER_DUE_AT = new Date("2026-04-14T00:00:00.000Z")
const TREATY_SIGNER_EFFORT_HOURS = 30 / 3600

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
    where: {
      deletedAt: null,
      status: { not: TaskStatus.VERIFIED },
      taskKey: { startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:` },
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      estimatedEffortHours: true,
      assigneeAffiliationSnapshot: true,
      assigneePerson: {
        select: {
          countryCode: true,
          displayName: true,
          handle: true,
          image: true,
        },
      },
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
      assigneeAffiliation: row.assigneeAffiliationSnapshot,
      assigneeCountryCode: row.assigneePerson?.countryCode ?? null,
      assigneeHandle: row.assigneePerson?.handle ?? null,
      assigneeImage: row.assigneePerson?.image ?? null,
      assigneeName: row.assigneePerson?.displayName ?? null,
      dueAt: row.dueAt,
      estimatedEffortHours: row.estimatedEffortHours,
      id: row.id,
      militarySpendingAnnualUsd: getMilitarySpending(
        row.assigneePerson?.countryCode ?? null,
      ),
      title: row.title,
    }))
    .sort((a, b) =>
      compareSignersByMilitarySpending(
        getMilitarySpending(a.assigneeCountryCode),
        getMilitarySpending(b.assigneeCountryCode),
      ),
    )
}

/**
 * Keep the public accountability board useful when a preview database is
 * unavailable or has not received its schema yet. The same canonical leader
 * dataset and stable task ids seed the database-backed version.
 */
export function buildTreatyPresidentManagementFallback(): TreatyPresidentManagementData {
  const signerTasks = listGovernmentLeaders().map((leader) => ({
    assigneeAffiliation: leader.governmentName,
    assigneeCountryCode: leader.countryCode,
    assigneeHandle: null,
    assigneeImage: leader.leaderImageUrl,
    assigneeName: leader.leaderName ?? leader.decisionMakerLabel,
    dueAt: TREATY_SIGNER_DUE_AT,
    estimatedEffortHours: TREATY_SIGNER_EFFORT_HOURS,
    id: `1-pct-treaty-signer-${leader.countryCode.toLowerCase()}`,
    militarySpendingAnnualUsd: leader.militaryBudgetUsd,
    title: "Sign the 1% Treaty",
  }))

  return {
    signerTasks,
    treatyProgram: {
      dueAt: TREATY_PROGRAM_DUE_AT,
      estimatedEffortHours: null,
      id: TREATY_PARENT_TASK_ID,
      title: "Ratify the 1% Treaty",
    },
  }
}

/**
 * The project plus its executable president tasks.
 *
 * This keeps the campaign route narrow while preserving the project-management
 * structure that the original Optimitron page exposed.
 */
export async function getTreatyPresidentManagementData(): Promise<TreatyPresidentManagementData> {
  try {
    const [signerTasks, treatyProgram] = await Promise.all([
      getTreatySignerTasks(),
      prisma.task.findUnique({
        where: { taskKey: TREATY_PARENT_TASK_KEY },
        select: {
          deletedAt: true,
          dueAt: true,
          estimatedEffortHours: true,
          id: true,
          status: true,
          title: true,
        },
      }),
    ])

    return {
      signerTasks,
      treatyProgram:
        treatyProgram &&
        treatyProgram.deletedAt == null &&
        treatyProgram.status !== TaskStatus.VERIFIED
          ? {
              dueAt: treatyProgram.dueAt,
              estimatedEffortHours: treatyProgram.estimatedEffortHours,
              id: treatyProgram.id,
              title: treatyProgram.title,
            }
          : null,
    }
  } catch (error) {
    log.warn("Treaty task data unavailable; rendering the managed roster fallback", {
      error,
    })
    return buildTreatyPresidentManagementFallback()
  }
}
