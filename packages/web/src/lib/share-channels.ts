/**
 * Share-channel URL builders and shared type.
 *
 * Used by the React share dialogs (TaskRowShare, TreatyReminderComposer) AND the
 * server-side email renderer. Keep this module dependency-free — no React,
 * no Prisma, no Next.js helpers — so it works in both environments.
 */

export type ReminderChannel =
  | "bluesky"
  | "copy-link"
  | "copy-message"
  | "email"
  | "facebook"
  | "linkedin"
  | "reddit"
  | "sms"
  | "telegram"
  | "whatsapp"
  | "x";

/** Channels that produce an HTTPS (or mailto:) URL to open. */
export type ShareableChannel = Exclude<ReminderChannel, "copy-link" | "copy-message">;

export interface ShareChannelInput {
  /** The rendered, user-facing message (may contain newlines and the referral URL). */
  message: string;
  /** A short one-liner fallback used for Reddit's `title` param. */
  shareText: string;
  /** Optional direct recipient for mailto links. */
  recipientEmail?: string | null;
  /** The canonical URL to attach for URL-only channels (already may contain sa=). */
  shareUrl?: string;
  /** The URL the share is ultimately about (task page or owned referral link). */
  taskUrl: string;
  /** Human-readable task title — used for the default email subject. */
  taskTitle: string;
}

export function buildChannelHref(channel: ShareableChannel, input: ShareChannelInput): string {
  const encodedMessage = encodeURIComponent(input.message);
  const encodedUrl = encodeURIComponent(input.shareUrl ?? input.taskUrl);
  switch (channel) {
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
    case "bluesky":
      return `https://bsky.app/intent/compose?text=${encodedMessage}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(input.shareText)}`;
    case "sms":
      return `sms:?&body=${encodedMessage}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedMessage}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
    case "email": {
      const subject = encodeURIComponent(`Please complete: ${input.taskTitle}`);
      const recipient = input.recipientEmail?.trim()
        ? encodeURI(input.recipientEmail.trim())
        : "";
      return `mailto:${recipient}?subject=${subject}&body=${encodedMessage}`;
    }
  }
}

/**
 * Inject (or replace) the `sa` query parameter on every occurrence of the
 * given owned base URL inside a message body. The `sa` param is how we tie a
 * recipient's click back to the ShareAttempt row that generated this outbound
 * message.
 *
 * Matches `${baseUrl}` optionally followed by existing query/fragment. Replaces
 * (or adds) `sa=<id>` without dropping other params.
 */
export function embedShareAttemptId(message: string, baseUrl: string, shareAttemptId: string): string {
  if (!message || !baseUrl || !shareAttemptId) return message;
  // Escape regex-sensitive chars in baseUrl for the match; preserve any trailing path/query/fragment.
  const escaped = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // URL chars before whitespace or common HTML delimiters.
  const pattern = new RegExp(`(${escaped})([^\\s<>"']*)`, "g");
  return message.replace(pattern, (_full, prefix, tail: string) => {
    const trailingMatch = tail.match(/[),.!?:;]+$/);
    const trailing = trailingMatch?.[0] ?? "";
    const cleanTail = trailing ? tail.slice(0, -trailing.length) : tail;
    const url = new URL(`${prefix}${cleanTail}`);
    url.searchParams.set("sa", shareAttemptId);
    return `${url.toString()}${trailing}`;
  });
}
