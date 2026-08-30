/**
 * One treaty-signer task: a head of government who owes humanity a signature.
 *
 * Narrower than Optimitron's `TaskCardTask`, but complete for the public
 * president project board: assignee, deadline, effort, impact attribution,
 * task link, and reminder action. Keeping the shape focused avoids loading the
 * private and authenticated task-management fields the campaign page cannot use.
 */
export interface TreatySignerTask {
  assigneeAffiliation: string | null
  assigneeCountryCode: string | null
  assigneeHandle: string | null
  assigneeImage: string | null
  assigneeName: string | null
  dueAt: Date | null
  estimatedEffortHours: number | null
  id: string
  militarySpendingAnnualUsd: number | null
  title: string
}

export interface TreatyProgramTask {
  dueAt: Date | null
  estimatedEffortHours: number | null
  id: string
  title: string
}

export interface TreatyPresidentManagementData {
  signerTasks: TreatySignerTask[]
  treatyProgram: TreatyProgramTask | null
}

/**
 * Never let a frozen or misconfigured browser clock rewind accountability.
 *
 * The server timestamp is part of the rendered record. A client can advance
 * it after hydration, but it cannot turn an overdue task back into "on time."
 */
export function getAccountabilityReferenceMs(
  serverNowMs: number,
  clientNowMs: number | null,
) {
  return Math.max(serverNowMs, clientNowMs ?? serverNowMs)
}

/**
 * Order two signers so the governments the treaty asks for the most money from
 * come first.
 *
 * Military spending is the figure the 1% Treaty redirects, so the biggest
 * spenders are the ones a visitor should be reminding. Optimitron reaches a
 * comparable order through its expected-value task ranker, which needs the
 * whole task tree — the thing this page deliberately does not load.
 *
 * Returns 0 for two governments with equal (or equally missing) spending, so
 * the caller's existing order survives: the query already sorts by assignee
 * name and id, which is what keeps unranked governments from reshuffling
 * between renders.
 */
export function compareSignersByMilitarySpending(
  aSpending: number | null,
  bSpending: number | null,
): number {
  if (aSpending === bSpending) return 0
  return (bSpending ?? -1) - (aSpending ?? -1)
}
