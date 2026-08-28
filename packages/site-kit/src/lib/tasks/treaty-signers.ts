/**
 * One treaty-signer task: a head of government who owes humanity a signature.
 *
 * Deliberately narrower than Optimitron's `TaskCardTask`. The campaign page
 * renders a roster, not the task-management UI, so it needs a name, a due
 * date, and a link — not estimates, claims, funding, or child tasks. Keeping
 * the shape small is what lets this read from one indexed query instead of
 * Optimitron's whole-tree `getTasksPageData`.
 */
export interface TreatySignerTask {
  assigneeCountryCode: string | null
  assigneeName: string | null
  dueAt: Date | null
  id: string
  title: string
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
