import { ROUTES } from "./routes"

/**
 * Where the register form sends someone after their plaintiff saves. One
 * plaintiff opens straight into its editor; several land on the list.
 */
export function getRepresentedPersonDetailsHref(
  people: Array<{ personId?: string | null }>,
) {
  const firstPersonId = people.length === 1 ? people[0]?.personId : null
  if (!firstPersonId) return ROUTES.plaintiffsManage
  return `${ROUTES.plaintiffsManage}?edit=${encodeURIComponent(firstPersonId)}`
}
