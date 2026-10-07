import { US_STATES } from "@optimitron/site-kit/lib/us-states"

// Shared by the /support forms and the server, so it imports nothing server-only.
export const OUTSIDE_US = "Outside the United States"
export const NATIONWIDE = "Nationwide"

const stateNames: string[] = US_STATES.map(([name]) => name)

/** A person picks their state, or says they live outside the US. */
const supporterStates: string[] = [...stateNames, OUTSIDE_US]
export const SUPPORTER_STATES = supporterStates as [string, ...string[]]

/** An organization picks the state it works in, or says it works nationwide or outside the US. */
const organizationStates: string[] = [...stateNames, NATIONWIDE, OUTSIDE_US]
export const ORGANIZATION_STATES = organizationStates as [string, ...string[]]
