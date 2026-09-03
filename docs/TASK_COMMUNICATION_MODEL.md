# Task Communication Model

Optimitron needs agents to take the highest-value action to increase median health-adjusted life expectancy and median after-tax inflation-adjusted income. The task communication schema keeps the record clear enough that agents can act, users can read what happened, and analytics can measure which messages moved work forward.

## Model Boundaries

- `Task` is the assigned work item.
- `TaskCommunicationEndpoint` stores how to reach the assignee: email, mailto, official form, public page, profile, in-app route, or manual instructions.
- `TaskComment` stores the readable thread: comments, outgoing messages, inbound replies, manual assignee responses, and status notes.
- `TaskCommunication` stores the envelope: channel, recipient, endpoint, provider IDs, status, metadata, and the link to the readable comment.
- `EmailLog` stores provider-level email delivery details.
- `Activity` stays a lightweight audit feed, not the canonical message store.

## Lifecycle

`TaskCommunication.status` is deliberately small:

- `DRAFT`
- `SENT`
- `RECEIVED`
- `FAILED`
- `CANCELLED`

External URL/form details such as `openedAt` and `submittedAt` live in `TaskCommunication.metadataJson`. Opening a URL is not proof that a form was submitted, so `submittedAt` should only be recorded when a user or agent confirms submission.

## Write Rules

- Outgoing Optimitron/Wishonia messages create a `TaskComment(kind=OUTBOUND_MESSAGE)` plus a linked `TaskCommunication`.
- Email sends also link the `TaskCommunication` to `EmailLog`.
- External URL or mailto actions create `TaskCommunication(status=SENT)` with metadata such as `openedAt`.
- Replies and manual assignee responses create `TaskComment(kind=INBOUND_MESSAGE)` and, when useful, a `TaskCommunication(status=RECEIVED)`.

## TaskCommentKind semantics

| Kind               | When to use                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `COMMENT`          | Default. A user-authored discussion comment about the task.                                                                                                                          |
| `OUTBOUND_MESSAGE` | Readable copy of a message Optimitron/Wishonia/an agent sent to the assignee or another party. Always paired with a `TaskCommunication` that owns the envelope.                      |
| `INBOUND_MESSAGE`  | A reply or unsolicited message from the assignee or external party (email reply, web form, or manual import). May be paired with a `TaskCommunication(status=RECEIVED)`.             |
| `STATUS_UPDATE`    | A status announcement on the task ("the senator's office confirmed they will support"). Posted by a user or an agent; may link to a `TaskCommunication` if it was the result of one. |
| `SYSTEM_NOTE`      | Automated narration ("Wishonia notes the task has been overdue 30 days"). Authored by the system user.                                                                               |

## Author identity

`TaskComment.authorUserId` may be null for inbound messages whose author has no `User` account. For all `OUTBOUND_MESSAGE` and `SYSTEM_NOTE` comments authored by Optimitron/Wishonia/the system, the canonical pattern is: a single seeded `wishonia` system `User` row owns these comments. The system user is excluded from normal user listings (filter on a future `User.isSystem` flag if needed). External-author fields (`authorPersonId`, `authorOrganizationId`, `authorNameSnapshot`) populate when the comment originates from a `Person` or `Organization` that has no `User` row — typical for `INBOUND_MESSAGE` from officials we contacted but who never signed up.

Do not pre-create the system user in TODO-style "do this when convenient" follow-ups. The system user MUST exist before any code path writes a `TaskComment` of kind `OUTBOUND_MESSAGE` or `SYSTEM_NOTE`.

## Endpoint priority and selection

When a task has multiple `TaskCommunicationEndpoint` rows, the engine selects the outbound endpoint in this order:

1. Highest-priority `isPrimary=true` endpoint with `verificationStatus=VERIFIED`.
2. Highest-priority `isPrimary=true` endpoint regardless of verification status.
3. Highest-priority endpoint with `verificationStatus=VERIFIED`.
4. Highest-priority endpoint regardless of status.
5. None (the engine returns null and the caller falls back — typically a Google search action for an "official contact" page).

`priority` is an integer where lower means higher priority. Manually curated endpoints have `priority=0`. Backfilled / auto-discovered endpoints get higher values. `isPrimary` ties go to lowest `priority` first, then most recently `updatedAt`.

## Inbound email guardrails

Optimitron receives Resend events at `https://optimitron.com/api/webhooks/resend`. The War on Disease path `/api/webhooks/resend` forwards to this handler for compatibility. Keep one Resend webhook registration, pointed at the canonical Optimitron URL, to avoid duplicate deliveries.

The handler records delivery events and handles bounces and complaints. For `email.received`, it decodes `reply+{taskId}@{REPLY_EMAIL_DOMAIN}`, authenticates the sender against the task creator, assignee, organization contact, or task contact endpoint, strips quoted text, and writes a `TaskComment(kind=INBOUND_MESSAGE)` plus `TaskCommunication(status=RECEIVED)`.

Do not surface "reply by email" unless both of these are true:

- `RESEND_WEBHOOK_SECRET` and `REPLY_EMAIL_DOMAIN` are configured for the Optimitron deployment.
- Resend receives mail for that domain and sends `email.received` to the enabled webhook with the matching signature secret.

Still-required production guardrails before broad rollout:

- DKIM/SPF/DMARC verification on every inbound message where the provider exposes it.
- Stronger threading via `References` and `In-Reply-To` headers, linking the inbound message back to the originating outbound `TaskCommunication`.
- Spam filtering and disposable-address detection.
- Loop prevention so an auto-responder on the recipient side does not infinitely bounce against the inbound handler.

## Activity vs TaskCommunication

`Activity` is the cross-task feed that powers user dashboards. It is NOT the canonical record of any communication. To avoid double-writing substantive content:

- `TaskCommunication` owns the envelope: channel, recipient, endpoint, provider IDs, status, metadata. The single source of truth for "this message went out / came in".
- `TaskComment` owns the readable thread: who said what, when, in what context.
- `Activity` is a feed-friendly _summary_ that points at the above via foreign keys. An `ActivityType.CONTACTED_ASSIGNEE` row carries the headline and a link to the `TaskCommunication` row that holds the substance.

Never copy a message body into all three. The body lives in `TaskComment.body`; the envelope lives in `TaskCommunication`; `Activity` carries only enough text to render a one-line feed entry.
