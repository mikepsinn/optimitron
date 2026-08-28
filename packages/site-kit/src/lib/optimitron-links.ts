/**
 * Cross-domain links back to Optimitron.
 *
 * Pages migrated from Optimitron to a campaign app keep referring to surfaces
 * that stay on optimitron.com — the task tree, people, messages. Inside
 * Optimitron those were root-relative `ROUTES.*` paths; from another domain the
 * same path 404s. Routing them through here makes every surviving cross-app
 * link explicit and greppable, instead of scattering bare origin strings across
 * ported pages.
 *
 * Anything that MOVED to the campaign app is not listed here — it stays a
 * relative route so it resolves against whichever domain is serving the page.
 */

export const OPTIMITRON_ORIGIN = "https://optimitron.com"

/** Absolute URL for a path that stays on optimitron.com. */
export function optimitronUrl(path: string): string {
  return `${OPTIMITRON_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * The Optimitron surfaces migrated campaign pages still link to. `label` is the
 * text those pages already print for the link, kept beside the URL so the two
 * cannot drift apart.
 */
export const OPTIMITRON_LINKS = {
  tasksTree: {
    url: optimitronUrl("/tasks/tree"),
    label: "optimitron.com/tasks/tree",
  },
  people: {
    url: optimitronUrl("/people"),
    label: "optimitron.com/people",
  },
  messages: {
    url: optimitronUrl("/messages"),
    label: "optimitron.com/messages",
  },
  profileMissions: {
    url: optimitronUrl("/profile#missions"),
    label: "optimitron.com/profile",
  },
} as const

export type OptimitronLinkId = keyof typeof OPTIMITRON_LINKS
