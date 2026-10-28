# Public reads and database sleep

The reduced production cron schedule leaves gaps for Neon's five-minute idle
timeout, but anonymous page requests can still query Postgres during those gaps.
Task pages previously loaded their graph, ancestors, comments, and activity for
each request; metadata repeated the task detail query. Person metadata and share
images also bypassed the existing public profile cache.

Anonymous task pages now share a one-hour Next data cache. Metadata reuses the
same cached task detail. Signed-in task reads remain live and the shared readers
always use a null viewer. Private or missing tasks keep the existing access gate;
database failures propagate instead of becoming cached empty content. Server-side
serialization preserves Date and BigInt values used by task/profile rendering.
The absence of a funding target is cached too, so unfunded tasks do not query
funding on every visit. Actual funding balances and supporter walls remain live.
New targets created outside task mutations may take up to one hour to appear to
anonymous visitors; signed-in users see them immediately.

Public person metadata, page content, and share images now reuse the existing
five-minute profile cache and its visibility invalidation tag.

Task creation, edits, deletion, comment changes, document edits, MCP edits and
deletions, imports, and task merges invalidate `public-task-read` after their
transaction commits. Other background status changes may take up to one hour to
appear to anonymous visitors; authenticated users still read current data.
CLI maintenance scripts lack a Next request context and must separately invalidate
the deployed tag after direct writes. A merge called with an existing transaction
client requires invalidation by the caller after commit.

Cold requests for different task IDs and profile URLs, hourly cron work, cache
expiry, and genuine use can still wake the database. This removes repeated public
reads; it does not guarantee zero compute or uninterrupted sleep. Compare Neon's
active-time chart over a full day after deployment, rather than counting idle
connections or treating cumulative query counters as a rate.
