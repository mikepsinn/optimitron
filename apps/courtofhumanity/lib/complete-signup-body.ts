/**
 * Builds the POST body for /api/auth/complete-signup from stored signup data.
 *
 * `newsletterSubscribed` is omitted when nothing was stored rather than
 * defaulted to `true`. The shared handler only writes the column when it
 * receives a boolean, and the schema already defaults new users to subscribed,
 * so omitting it is identical for a first-time signer. It is not identical for
 * someone who unsubscribed earlier and later returns through a referral or
 * invite link: their stored preference is `null` here, and sending `true` would
 * silently resubscribe them without any affirmative choice on this visit.
 */
export function buildCompleteSignupBody(input: {
  name: string | null
  referralCode: string | null
  inviteToken: string | null
  newsletterSubscribed: boolean | null
}): Record<string, unknown> {
  return {
    name: input.name || null,
    referralCode: input.referralCode || null,
    inviteToken: input.inviteToken || null,
    ...(input.newsletterSubscribed !== null
      ? { newsletterSubscribed: input.newsletterSubscribed }
      : {}),
  }
}
