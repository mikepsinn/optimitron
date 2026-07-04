/**
 * Aggregate registry of every previewable outbound email.
 *
 * Each builder file (`*-email.ts` / `*-email.server.ts`) exports its own
 * `*_PREVIEW: EmailPreview` const colocated with its `build*Html` function
 * and subject constants. This file pulls them into a single map so the
 * `/dev/email/[template]` route and `render-emails-to-markdown.ts` can
 * iterate without re-encoding envelope metadata.
 *
 * Adding a new email = export a new `*_PREVIEW` from its builder file +
 * one new entry here.
 */

import { MAGIC_LINK_PREVIEW } from "@/lib/email/magic-link-render";
import { MONTHLY_CHAIN_DIGEST_PREVIEW } from "@/lib/email/monthly-chain-digest-email";
import { POST_VOTE_SHARE_PREVIEW } from "@/lib/email/post-vote-share-email";
import type { EmailPreview } from "@/lib/email/preview-envelope";
import { REFERRAL_FIRST_CONVERSION_PREVIEW } from "@/lib/email/referral-first-conversion-email";
import { TASK_FUNDING_PLEDGE_CONFIRMATION_PREVIEW } from "@/lib/email/task-funding-pledge-confirmation-email";
import { TASK_FUNDING_PLEDGE_DECLINE_PREVIEW } from "@/lib/email/task-funding-pledge-decline-email";
import { TASK_FUNDING_PLEDGE_RECEIPT_PREVIEW } from "@/lib/email/task-funding-pledge-receipt-email";
import { TASK_ASSIGNMENT_PREVIEW } from "@/lib/tasks/task-assignment-notification-email.server";
import { TASK_COMMENT_NOTIFICATION_PREVIEW } from "@/lib/tasks/task-comment-notification-email.server";

export const EMAIL_PREVIEWS: ReadonlyArray<EmailPreview> = [
  MAGIC_LINK_PREVIEW,
  POST_VOTE_SHARE_PREVIEW,
  REFERRAL_FIRST_CONVERSION_PREVIEW,
  MONTHLY_CHAIN_DIGEST_PREVIEW,
  TASK_ASSIGNMENT_PREVIEW,
  TASK_COMMENT_NOTIFICATION_PREVIEW,
  TASK_FUNDING_PLEDGE_CONFIRMATION_PREVIEW,
  TASK_FUNDING_PLEDGE_DECLINE_PREVIEW,
  TASK_FUNDING_PLEDGE_RECEIPT_PREVIEW,
];

export function getEmailPreview(templateId: string): EmailPreview | undefined {
  return EMAIL_PREVIEWS.find((p) => p.templateId === templateId);
}

export function listEmailPreviewTemplateIds(): string[] {
  return EMAIL_PREVIEWS.map((p) => p.templateId);
}
