import { createHmac, timingSafeEqual } from "node:crypto"

/** What a link in a support email lets its holder do: confirm a person's support, or list an organization. */
export type SupportLinkAction = "confirm-supporter" | "approve-organization"

const SITE_URL = "https://acceleratedmedicine.org"
const paths: Record<SupportLinkAction, string> = {
  "confirm-supporter": "/support/confirm",
  "approve-organization": "/support/approve",
}

// The forms' rate-limit secret also signs these links. The "support-link" prefix keeps the two uses apart,
// so a client key can never pass as a link signature.
const signingSecret = () => process.env.RIGHT_TO_TRY_RATE_LIMIT_SECRET

function sign(secret: string, action: SupportLinkAction, submissionId: string): string {
  return createHmac("sha256", secret).update(`support-link:${action}:${submissionId}`).digest("base64url")
}

export function signSupportLink(action: SupportLinkAction, submissionId: string): string {
  const secret = signingSecret()
  if (!secret) {
    throw new Error("Form signing secret is not configured")
  }
  return sign(secret, action, submissionId)
}

/** True only for the signature of this action on this submission, so a confirmation link cannot approve. */
export function verifySupportLink(action: SupportLinkAction, submissionId: string, token: string): boolean {
  const secret = signingSecret()
  if (!secret || !submissionId || !token) return false
  const expected = Buffer.from(sign(secret, action, submissionId))
  const given = Buffer.from(token)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export function supportLinkUrl(action: SupportLinkAction, submissionId: string): string {
  const query = new URLSearchParams({ s: submissionId, t: signSupportLink(action, submissionId) })
  return `${SITE_URL}${paths[action]}?${query}`
}
