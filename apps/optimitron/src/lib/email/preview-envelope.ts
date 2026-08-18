/**
 * Email preview envelope & shared compose primitives.
 *
 * Single source of truth for two things that resend.ts (real sends) and
 * the /dev/email/[template] preview route both need:
 *
 *  1. The compose pipeline: substitute the unsubscribe-URL placeholder in
 *     the body, then append the Wishonia signature unless the call site
 *     has its own sender identity (per-message `from`) or has explicitly
 *     opted out via `skipWishoniaSignature`.
 *
 *  2. Per-template preview metadata: the envelope each template would
 *     have if it were actually sent (subject, From, optional Reply-To,
 *     skip-signature flag), plus a one-line trigger description
 *     ("when does this fire?") for the markdown previews.
 *
 * The preview route and the email markdown generator import from here;
 * each builder file exports its own `*_PREVIEW` const and `previewRegistry`
 * aggregates them. Adding a template = a new const + one registry entry.
 */

import type { ReactElement } from "react";
import {
  buildWishoniaSignatureHtml,
  buildWishoniaSignatureText,
  selectWishoniaSignature,
  WISHONIA_SIGNATURE_TITLE,
  WISHONIA_TAGLINES,
  type WishoniaSignatureSelection,
} from "@/lib/email/wishonia-signature";
import { EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER } from "@/lib/email/placeholders";
import { renderReactEmailHtml } from "@/lib/email/render-react-email";
import { isEmailScope, isTransactionalScope } from "@/lib/email/scopes";

/** Realistic-looking sample values used by every preview renderer. */
export const SAMPLE_REFERRAL_URL = "https://warondisease.org/vote/SAMPLE";
export const SAMPLE_DASHBOARD_URL = "https://warondisease.org/dashboard";
export const SAMPLE_UNSUBSCRIBE_URL =
  "https://warondisease.org/api/email/unsubscribe?token=SAMPLE";
export const SAMPLE_TASK_ID = "sample-task-id";
export const SAMPLE_TASK_REPLY_ADDRESS =
  "task+sample-task-id@updates.warondisease.org";

/**
 * Per-template preview metadata. Each email builder module exports one of
 * these so the preview route doesn't need to duplicate envelope decisions
 * the call site already encoded.
 */
export interface EmailPreview {
  /** Stable slug used as both the URL path segment and the `.email.md` filename stem. */
  templateId: string;
  /** Human-readable name surfaced in the markdown preview header. */
  displayName: string;
  /**
   * One- or two-sentence description of WHEN this email fires and WHAT
   * action triggers it. Surfaces in the generated `.email.md` so reviewers
   * can see context without grepping the send-site.
   */
  trigger: string;
  /** Suppression scope used by `canSendEmailToUser` at real send time. */
  scope: string;
  /** Render the envelope's `From` header. Functions because some need runtime config. */
  from: () => string;
  /** Render the subject. */
  subject: () => string;
  /** Optional Reply-To. */
  replyTo?: () => string;
  /**
   * When true, the Wishonia signature is NOT auto-appended. Mirrors the
   * `skipWishoniaSignature` flag the call site passes to resend.ts.
   */
  skipWishoniaSignature: boolean;
  /** Render a legacy string-built body HTML with realistic fixture inputs. */
  render?: () => string;
  /** Render the body from the React Email template used by real sends. */
  renderReact?: () => ReactElement;
}

interface ComposeOptions {
  skipWishoniaSignature: boolean;
  /** Per-message `from` override — drives the same skip-signature gate as resend.ts. */
  hasFromOverride: boolean;
  unsubscribeUrl: string;
  /**
   * Optional deterministic Wishonia selection. Real sends pick at random
   * across 165 combinations; previews pin to the first title/tagline so
   * the `.email.md` snapshots don't churn on every regen.
   */
  wishoniaSelection?: WishoniaSignatureSelection;
}

/**
 * Body-text pair used by both real sends and previews. Matches the shape
 * resend.ts's helpers operate on so they can also consume this composer.
 */
export interface EmailBody {
  html: string;
  text: string;
}

/**
 * Substitute `{{UNSUBSCRIBE_URL}}` in body html + text. Returns the same
 * object reference if the placeholder isn't present, mirroring the
 * existing resend.ts behavior.
 */
export function replaceUnsubscribePlaceholder<T extends EmailBody>(
  message: T,
  unsubscribeUrl: string | null,
): T {
  if (!unsubscribeUrl) return message;
  if (
    !message.html.includes(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER) &&
    !message.text.includes(EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER)
  ) {
    return message;
  }
  return {
    ...message,
    html: message.html.replaceAll(
      EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER,
      unsubscribeUrl,
    ),
    text: message.text.replaceAll(
      EMAIL_UNSUBSCRIBE_URL_PLACEHOLDER,
      unsubscribeUrl,
    ),
  };
}

/**
 * Decide whether to append the Wishonia signature for a given send.
 * A per-message `from` (e.g. share emails that foreground the sender's
 * name) or an explicit `skipWishoniaSignature` flag suppresses the sig
 * so we don't double-sign on top of a real human's identity.
 */
export function shouldSkipWishoniaSignature(message: {
  from?: string;
  skipWishoniaSignature?: boolean;
}): boolean {
  return Boolean(message.from) || Boolean(message.skipWishoniaSignature);
}

/**
 * Append the Wishonia signature HTML to a body. For React-Email-rendered
 * bodies (full `<html><body>...</body></html>` documents), inject just
 * before `</body>` so the signature stays inside the DOM. For legacy
 * inline-HTML fragments (no `<body>` tag), concatenate.
 */
function appendSignatureToHtml(html: string, signature: string): string {
  const bodyCloseIdx = html.search(/<\/body\s*>/i);
  if (bodyCloseIdx >= 0) {
    return html.slice(0, bodyCloseIdx) + signature + html.slice(bodyCloseIdx);
  }
  return `${html}${signature}`;
}

/**
 * Compose the final body (html + text) the way real sends do: substitute
 * the unsubscribe URL, then append the Wishonia signature unless the
 * call site opts out. Used by resend.ts (with a real unsubscribe URL +
 * random Wishonia selection) and by the preview pipeline (with a sample
 * URL + deterministic selection).
 */
export function composeOutboundEmailBody<T extends EmailBody>(
  message: T,
  options: ComposeOptions,
): T {
  const withUnsub = replaceUnsubscribePlaceholder(
    message,
    options.unsubscribeUrl,
  );
  const skip = options.skipWishoniaSignature || options.hasFromOverride;
  if (skip) return withUnsub;
  const selection = options.wishoniaSelection ?? selectWishoniaSignature();
  return {
    ...withUnsub,
    text: `${withUnsub.text}${buildWishoniaSignatureText(selection)}`,
    html: appendSignatureToHtml(
      withUnsub.html,
      buildWishoniaSignatureHtml(selection),
    ),
  };
}

/**
 * Deterministic Wishonia selection used in every preview render so the
 * `.email.md` snapshots are stable diffs. Real sends pick at random.
 */
export const PREVIEW_WISHONIA_SELECTION: WishoniaSignatureSelection = {
  title: WISHONIA_SIGNATURE_TITLE,
  tagline: WISHONIA_TAGLINES[0]!,
};

export async function renderPreviewBodyHtml(
  preview: EmailPreview,
): Promise<string> {
  if (preview.renderReact) {
    return renderReactEmailHtml(preview.renderReact());
  }
  if (preview.render) {
    return preview.render();
  }
  throw new Error(`Email preview ${preview.templateId} has no renderer.`);
}

/**
 * Inject preview-only chrome (header block, unsubscribe footer) into the
 * rendered email body. React Email's `render()` returns a full HTML
 * document with `<html><body>...</body></html>`, so we have to splice
 * inside the body — otherwise the chrome lands after `</body>` where
 * the DOM walker (and most mail clients) can't see it.
 *
 * For legacy inline-HTML bodies (no `<body>` tag), we just concatenate.
 */
function spliceIntoBody(
  bodyHtml: string,
  before: string,
  after: string,
): string {
  const bodyOpenMatch = bodyHtml.match(/<body[^>]*>/i);
  const bodyCloseIdx = bodyHtml.search(/<\/body\s*>/i);
  if (bodyOpenMatch && bodyCloseIdx >= 0) {
    const openEnd = bodyOpenMatch.index! + bodyOpenMatch[0].length;
    return (
      bodyHtml.slice(0, openEnd) +
      before +
      bodyHtml.slice(openEnd, bodyCloseIdx) +
      after +
      bodyHtml.slice(bodyCloseIdx)
    );
  }
  return `${before}${bodyHtml}${after}`;
}

/**
 * Build the full preview HTML for a single template: header metadata
 * block + body (with unsub substitution + signature) + unsubscribe footer.
 * The header block is preview-only — real sends ship `From` / `Subject` /
 * `Reply-To` as SMTP headers, not as body content.
 */
export async function buildFullPreviewHtml(
  preview: EmailPreview,
): Promise<string> {
  const from = preview.from();
  const subject = preview.subject();
  const replyTo = preview.replyTo?.();
  const bodyHtml = await renderPreviewBodyHtml(preview);
  const showsUnsubscribe =
    isEmailScope(preview.scope) && !isTransactionalScope(preview.scope);

  const composed = composeOutboundEmailBody(
    { html: bodyHtml, text: "" },
    {
      skipWishoniaSignature: preview.skipWishoniaSignature,
      hasFromOverride: false,
      unsubscribeUrl: showsUnsubscribe ? SAMPLE_UNSUBSCRIBE_URL : "",
      wishoniaSelection: PREVIEW_WISHONIA_SELECTION,
    },
  );

  const headerRows = [
    renderMetaRow("From", from),
    renderMetaRow("Subject", subject),
    replyTo ? renderMetaRow("Reply-To", replyTo) : "",
    renderMetaRow("Trigger", preview.trigger),
    renderMetaRow("Scope", preview.scope),
  ]
    .filter(Boolean)
    .join("\n");

  const headerBlock = `<section data-email-headers style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#3f3f46;background:#f4f4f5;border-bottom:1px solid #d4d4d8;padding:16px 32px;">${headerRows}</section>`;

  const unsubscribeFooter = showsUnsubscribe
    ? `<section data-email-unsubscribe style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#71717a;padding:16px 32px;border-top:1px solid #d4d4d8;margin-top:24px;"><a href="${SAMPLE_UNSUBSCRIBE_URL}" style="color:#71717a;">Unsubscribe</a></section>`
    : "";

  return spliceIntoBody(composed.html, headerBlock, unsubscribeFooter);
}

function renderMetaRow(label: string, value: string): string {
  return `<p data-email-meta="${label.toLowerCase()}" style="margin:0 0 4px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
