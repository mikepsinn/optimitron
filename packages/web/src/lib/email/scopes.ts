/**
 * Email scope registry. Adding a new email type = one entry here + a `scope`
 * arg at its send site. No schema change per email type.
 *
 * - `transactional: true` scopes BYPASS all user suppression — magic-link,
 *   password-reset, security alerts. A user cannot opt out of these, so they
 *   must not advertise one-click unsubscribe headers.
 * - `master: true` is the special "all non-essential email" bucket. Adding
 *   "all" to a user's unsubscribedScopes blocks every non-transactional scope,
 *   including future ones they never explicitly opted into.
 */

export interface EmailScopeDescriptor {
  /** Short user-facing label for preferences UI. */
  label: string;
  /** When true, user suppression is ignored (magic-link, security). */
  transactional: boolean;
  /** When true, this scope is the "opt out of everything" master bucket. */
  master?: boolean;
  /** Longer description for the preferences UI (optional). */
  description?: string;
}

export const EMAIL_SCOPES: Record<string, EmailScopeDescriptor> = {
  all: {
    label: "All non-essential email",
    description: "Opt out of every non-transactional email, present and future.",
    transactional: false,
    master: true,
  },
  onboarding: {
    label: "Welcome and setup",
    description: "First-week emails that help you find the core features.",
    transactional: false,
  },
  task_notifications: {
    label: "Task notifications",
    description: "Assignments, reminders, and task updates.",
    transactional: false,
  },
  magic_link: {
    label: "Sign-in links",
    transactional: true,
  },
  account_security: {
    label: "Security and account alerts",
    transactional: true,
  },
};

export type EmailScope =
  | "all"
  | "onboarding"
  | "task_notifications"
  | "magic_link"
  | "account_security";

/** All known scopes — useful for the preferences UI and the "all" expansion. */
export const ALL_EMAIL_SCOPES: readonly EmailScope[] = [
  "all",
  "onboarding",
  "task_notifications",
  "magic_link",
  "account_security",
];

/** Scopes the user can actually opt out of (non-transactional, non-master). */
export const NON_TRANSACTIONAL_SCOPES: readonly EmailScope[] = ALL_EMAIL_SCOPES.filter(
  (scope) => !EMAIL_SCOPES[scope].transactional && !EMAIL_SCOPES[scope].master,
);

export function isEmailScope(value: unknown): value is EmailScope {
  return typeof value === "string" && value in EMAIL_SCOPES;
}

export function isTransactionalScope(scope: EmailScope): boolean {
  return EMAIL_SCOPES[scope].transactional;
}

export function isMasterScope(scope: EmailScope): boolean {
  return Boolean(EMAIL_SCOPES[scope].master);
}
