# Treaty Referral Model Audit

This document captures the launch contract for the treaty referral, task, and
email models. The goal is to keep the first launch slice explicit without
turning it into a generalized messaging platform.

## Current Model Ownership

### ReferralInvitation

`ReferralInvitation` owns the lifecycle of a named invitation from a verified
sender to one recipient.

It should keep:

- Sender and recipient identity links: `referrerUserId`, optional
  `recipientPersonId`, `recipientName`, `recipientEmail`.
- Treaty context: optional `referendumId`, `convertedVoteId`, and `convertedAt`.
- Invite state: `inviteToken`, `recipientUnsubscribeToken`, `status`,
  `copiedAt`, `sentAt`, `deletedAt`.
- Recipient reminder state: `recipientEmailStep`, `nextRecipientEmailAt`,
  `lastRecipientEmailAt`, provider message/error fields, and
  `recipientUnsubscribedAt`.
- Sender reminder state: opt-in timestamp, step, next scheduled send, and last
  attempted send.
- Links to the work and ledger rows: optional `taskId` and `shareAttemptId`.

It should not become the outbound-message ledger. It may keep the current
`messageText` snapshot for compatibility and quick debugging, but the exact
rendered/sent message belongs on `ShareAttempt` when share-attempt creation is
wired into this flow.

### ShareAttempt

`ShareAttempt` owns the exact outbound message ledger and attribution surface.

It should keep:

- Exact rendered message text and hash: `renderedMessage`, `renderedHash`.
- Template metadata: `templateId`, `templateHash`, `templateBody`.
- Channel and surface metadata: `source`, `surface`, `channel`, `context`.
- Edit state: `wasEdited`.
- Attribution activation: `firstReferralClickAt`.
- Optional links to `Task`, `EmailLog`, and `ReferralInvitation`.

This is the right home for analytics about which message variant, channel, and
edited text produced downstream clicks and votes.

### EmailLog

`EmailLog` owns email delivery, dedupe, and provider state.

It should keep:

- Recipient and send target: `userId`, `toAddress`, `subject`.
- Dedupe/template identity: `templateId`, subject/body variant fields, and
  `sendContext`.
- Provider and webhook state: `providerMessageId`, `status`, `sentAt`,
  `deliveredAt`, `openedAt`, `bouncedAt`, `errorMessage`.

It should not duplicate full outbound body text. When exact body text matters,
that belongs on the related `ShareAttempt`.

### Task

`Task` owns the assigned work item and completion/verification state.

For treaty referrals, it should represent the recipient's assigned action:
complete the treaty vote. It should keep its existing task fields such as
assignee, title, description, contact URL/template, status, completion evidence,
and verification timestamps.

It should not own transport delivery, invite tokens, reminder scheduling, or the
exact copied/sent text.

## Template Model Decision

Do not add `TaskMessageTemplate` or `TaskMessageVariant` for this launch slice.

The current hardcoded treaty copy plus `ShareAttempt` metadata are enough until
one of these is true:

- A second task-message family ships.
- Non-developers need to edit, approve, or retire message variants.
- Analytics require first-class template records instead of stable string IDs
  and hashes.
- The same template must be shared across email, copy, task rows, and partner
  surfaces with versioned lifecycle controls.

Until then, the low-risk path is to keep templates in code, record stable IDs
and hashes on `ShareAttempt`, and avoid premature schema surface.

## Rename Decision

Rename sender-side "nudge" internals to "reminder" before launch:

- `senderNudgeOptedInAt` becomes `senderReminderOptedInAt`.
- `senderNudgeStep` becomes `senderReminderStep`.
- `nextSenderNudgeAt` becomes `nextSenderReminderAt`.
- `lastSenderNudgeAt` becomes `lastSenderReminderAt`.
- API action `nudgeOptIn` becomes `senderReminderOptIn`.
- Analytics parameter `wants_nudge` becomes `wants_reminder`.

Use a reviewable migration that renames columns and indexes. Do not reset local
or preview data for this cleanup.

## Refactor Boundary

The post-vote share flow should keep UI state and screen progression. Message
construction, invite URL construction, and `/api/referral-invitations` fetch
wrappers should live in a small client helper so transport details are testable
without rendering the whole flow.

Visible copy and flow behavior stay unchanged for this slice unless this audit
is updated with a specific copy drift.

## Next Hardening

After this contract is implemented:

- Exercise the full recipient invite-token path.
- Guard partner and demo lite-mode routes from mounting the full post-vote
  referral flow.
- Keep cron tests focused on due timing, suppression, inactive invitations,
  conversion, unsubscribe, and terminal-state schedule clearing.
