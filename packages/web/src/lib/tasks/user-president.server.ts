import {
  getOverdueSignerHighlights,
  type OverdueSignerHighlight,
  type SignerTaskLike,
} from "@/lib/tasks/overdue-signers.server";

/** Role titles we treat as the user's single head-of-state for personalization. */
const HEAD_OF_STATE_ROLE_REGEX = /president|prime minister|chancellor|head of state|premier|taoiseach/i;

interface ResolveInput<T extends SignerTaskLike> {
  countryCode: string | null | undefined;
  decoratedTasks: readonly T[];
  now: Date;
}

/**
 * Resolve the single overdue head-of-state for the user's country, or null
 * when we can't identify one (no country set, no matching role in the task
 * catalog, etc.). Reuses the existing `getOverdueSignerHighlights` pipeline to
 * avoid duplicating the delay-stats computation.
 */
export function resolveUserPresidentHighlight<T extends SignerTaskLike>(
  input: ResolveInput<T>,
): OverdueSignerHighlight | null {
  const countryCode = input.countryCode?.trim();
  if (!countryCode) return null;

  const countryLower = countryCode.toLowerCase();
  const countryMatched = input.decoratedTasks.filter((task) => {
    const taskCountry = task.assigneePerson?.countryCode?.toLowerCase();
    return taskCountry === countryLower;
  });
  if (countryMatched.length === 0) return null;

  const highlights = getOverdueSignerHighlights({
    decoratedTasks: countryMatched,
    userCountryCode: countryCode,
    now: input.now,
    limit: 10,
  });

  for (const highlight of highlights) {
    const role = highlight.roleTitle ?? "";
    if (HEAD_OF_STATE_ROLE_REGEX.test(role)) return highlight;
  }
  return null;
}
