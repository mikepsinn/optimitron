/**
 * Single source of truth for the canonical share message used across the
 * dashboard share card, the post-vote forward email, and every engaged-user
 * email footer. When the wording changes, change it here once.
 *
 * Plain string — no Wishonia-voice flair, no Markdown. Designed to be:
 *   - Copy-pasted verbatim into iMessage, WhatsApp, Signal, email, X, etc.
 *   - Forwardable as-is from the post-vote email body.
 *   - Free of tokens that need rendering — the only substitution is the
 *     user's referral URL inline.
 *
 * Why these words specifically:
 *   - "I love you" is the highest-conversion frame: people read messages
 *     from people they love. Cold language doesn't survive a glance.
 *   - "suffer and die of horrible diseases" repeats deliberately — the
 *     threat is what gets the recipient to click. Two passes through the
 *     same threat is fine in a short message.
 *   - "30 seconds" pre-empts the most common objection (this looks like
 *     work). Click → vote → done.
 *   - The URL appears inline rather than as a "click here" button so the
 *     same string works in plain-text and HTML inboxes alike.
 */
export function buildShareMessage(referralUrl: string): string {
  return `I love you and don't want you to suffer and die of horrible diseases so please take 30 seconds to vote on this stupid treaty at ${referralUrl} as it will reduce the likelihood you will suffer and die of horrible diseases.`;
}
