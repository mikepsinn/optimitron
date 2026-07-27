/**
 * Wishonia email signature — appended to every outgoing email by the
 * Resend send helpers in `resend.ts`.
 *
 * Fixed name + title (Wishonia Love / CEO of Universe Optimization Services),
 * with a rotating tagline per send so recipients who get multiple emails
 * slowly notice something is off (collectors' items).
 *
 * Spec: docs/questions.md → Add Wishonia email signature task.
 */

import { EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME } from "@optimitron/db/system-identities";
import { getBaseUrl } from "@/lib/url";

export const WISHONIA_AVATAR_PATH = "/sprites/wishonia/happy-smile.png";

export const WISHONIA_SIGNATURE_NAME = "Wishonia Love";
export const WISHONIA_SIGNATURE_TITLE =
  "CEO of Universe Optimization Services";

export const WISHONIA_TAGLINES: readonly string[] = [
  "Maximizing median income and health-adjusted life years since 2026",
  "Optimizing Earth's default settings since 2026",
  "Enterprise solutions for not dying",
  "Redirecting civilization's survival budget since 2026",
  "Performing routine maintenance on your species since 2026",
  "Filing bug reports on human civilization since 2026",
  "Loading better priorities into humanity's RAM since 2026",
  "Politely suggesting humanity check its math since 2026",
  "Helping 8 billion people notice the obvious since 2026",
  "Making civilization's spreadsheet add up since 2026",
  "Your species' first general welfare audit",
];

export interface WishoniaSignatureSelection {
  /** Fixed title — kept on the selection object so previews stay stable. */
  title: string;
  tagline: string;
}

/**
 * Fixed title + a tagline drawn at random from WISHONIA_TAGLINES.
 */
export function selectWishoniaSignature(): WishoniaSignatureSelection {
  const tagline =
    WISHONIA_TAGLINES[Math.floor(Math.random() * WISHONIA_TAGLINES.length)]!;
  return { title: WISHONIA_SIGNATURE_TITLE, tagline };
}

/**
 * Plain-text signature for the `text` body of every outgoing email:
 *
 *   ---
 *   Love,
 *
 *   Wishonia Love
 *   CEO of Universe Optimization Services
 *   Maximizing median income and health-adjusted life years since 2026
 */
export function buildWishoniaSignatureText(
  selection: WishoniaSignatureSelection = selectWishoniaSignature(),
): string {
  return [
    "",
    "---",
    "",
    "Love,",
    "",
    WISHONIA_SIGNATURE_NAME,
    selection.title,
    selection.tagline,
  ].join("\n");
}

/**
 * Two-cell HTML signature with a Wishonia avatar (happy-smile sprite — used
 * elsewhere as her canonical face) and the title/tagline lines. Uses inline
 * styles + a table layout because that's what survives Gmail / Outlook /
 * Apple Mail rendering quirks. Tested against the standard email client trio.
 *
 * Avatar `src` is built via `getBaseUrl()` so the URL is absolute.
 */
export function buildWishoniaSignatureHtml(
  selection: WishoniaSignatureSelection = selectWishoniaSignature(),
  baseUrl: string = getBaseUrl(),
): string {
  const avatar = `${baseUrl.replace(/\/+$/, "")}${WISHONIA_AVATAR_PATH}`;
  // Inline styles — most email clients strip <style> blocks.
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0 0;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td valign="top" style="padding:0 16px 0 0;">
      <img src="${avatar}" alt="${escapeHtml(WISHONIA_SIGNATURE_NAME)}" width="80" height="80" style="display:block;width:80px;height:80px;border-radius:8px;background:#f4f4f5;border:0;outline:none;" />
    </td>
    <td valign="top" style="border-left:3px solid #111827;padding:0 0 0 16px;">
      <p style="font-size:14px;line-height:1.4;color:#3f3f46;margin:0 0 8px 0;">Love,</p>
      <p style="font-size:18px;font-weight:700;line-height:1.3;color:#111827;margin:0;">${escapeHtml(WISHONIA_SIGNATURE_NAME)}</p>
      <p style="font-size:14px;line-height:1.4;color:#3f3f46;margin:2px 0 0 0;">${escapeHtml(selection.title)}</p>
      <p style="font-size:12px;line-height:1.4;font-style:italic;color:#71717a;margin:8px 0 0 0;">${escapeHtml(selection.tagline)}</p>
    </td>
  </tr>
</table>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Append both signatures to a message's text + html bodies. Returns a NEW
 * object so the caller's input isn't mutated. One selection drives both
 * outputs so the same title/tagline appears in plain-text and HTML for the
 * same email — recipients who view both shouldn't see a mismatch.
 *
 * Idempotent on repeated calls? No — calling twice would add two signatures.
 * The Resend send helpers call this exactly once, immediately before
 * dispatch.
 */
export function appendWishoniaSignature<
  T extends { html: string; text: string },
>(message: T): T {
  const selection = selectWishoniaSignature();
  return {
    ...message,
    text: `${message.text}${buildWishoniaSignatureText(selection)}`,
    html: `${message.html}${buildWishoniaSignatureHtml(selection)}`,
  };
}

export interface SenderSignature {
  /** "Mike Sinn" — required. */
  name: string;
  /** "Recently promoted to Humanity Manager" — defaults to that exact line. */
  role?: string;
  /** "Earth Optimization Services Inc." — defaults to that exact org. */
  org?: string;
}

const DEFAULT_SENDER_ROLE = "Recently promoted to Humanity Manager";
const DEFAULT_SENDER_ORG = EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME;

/**
 * Build the share-email sender sign-off. Used when a real human (not
 * Wishonia) is the sender — e.g. a referrer inviting a friend. Mirrors the
 * Wishonia signature format so recipients reading multiple emails see a
 * coherent visual rhythm: separator, "Love," sign-off, name, role, org.
 *
 * Wishonia auto-append is gated on the absence of `from` on the message,
 * so when this signature is rendered into the body, Wishonia's is skipped
 * (no double-signing). See resend.ts.
 */
export function buildSenderSignatureText(signature: SenderSignature): string {
  const role = signature.role ?? DEFAULT_SENDER_ROLE;
  const org = signature.org ?? DEFAULT_SENDER_ORG;
  return ["", "---", "", "Love,", "", signature.name, role, org].join("\n");
}

export function buildSenderSignatureHtml(signature: SenderSignature): string {
  const role = signature.role ?? DEFAULT_SENDER_ROLE;
  const org = signature.org ?? DEFAULT_SENDER_ORG;
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0 0;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td valign="top" style="border-left:3px solid #111827;padding:0 0 0 16px;">
      <p style="font-size:14px;line-height:1.4;color:#3f3f46;margin:0 0 8px 0;">Love,</p>
      <p style="font-size:18px;font-weight:700;line-height:1.3;color:#111827;margin:0;">${escapeHtml(signature.name)}</p>
      <p style="font-size:14px;line-height:1.4;color:#3f3f46;margin:2px 0 0 0;">${escapeHtml(role)}</p>
      <p style="font-size:14px;line-height:1.4;font-weight:600;color:#111827;margin:8px 0 0 0;">${escapeHtml(org)}</p>
    </td>
  </tr>
</table>`.trim();
}
