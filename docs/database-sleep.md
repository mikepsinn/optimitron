# Public reads and database sleep

The reduced production cron schedule leaves gaps for Neon's five-minute idle
timeout, but anonymous page requests can still query Postgres during those gaps.
Task pages previously loaded their graph, ancestors, comments, and activity for
each request; metadata repeated the task detail query. Person metadata and share
images also bypassed the existing public profile cache.

Anonymous task pages now share a 24-hour Next data cache. Metadata reuses the
same cached task detail. Signed-in task reads remain live and the shared readers
always use a null viewer. Private or missing tasks keep the existing access gate;
database failures propagate instead of becoming cached empty content. Server-side
serialization preserves Date and BigInt values used by task/profile rendering.
The absence of a funding target is cached too, so unfunded tasks do not query
funding on every visit. Actual funding balances and supporter walls remain live.
Checkout and pledge setup invalidate cached target absence after creating the
first target, so anonymous donors can see its live funding status immediately.

Public person metadata, page content, and share images share a 24-hour cache
and retain the visibility invalidation tag. Public government pages reuse one
memorial attribution index across all countries, including empty countries.
Condition memorial totals and aggregate politician scoreboards are cached too.
Memorial changes, hiding/restoring content, and completed aggregation refresh
the affected public reads.

Task creation, edits, deletion, comment changes, document edits, MCP edits and
deletions, imports, and task merges invalidate `public-task-read` after their
transaction commits. Imports invalidate committed privacy changes before later
link work can fail. Wishonia replies run in Next's `after()` lifecycle and use a
separate reply tag so the original comment's cache flush cannot suppress theirs.
Other background status changes may take up to 24 hours to
appear to anonymous visitors; authenticated users still read current data.
CLI maintenance scripts lack a Next request context and must separately invalidate
the deployed tag after direct writes. A merge called with an existing transaction
client requires invalidation by the caller after commit.

Cold requests for different task IDs and profile URLs, hourly cron work, cache
expiry, and genuine use can still wake the database. This removes repeated public
reads; it does not guarantee zero compute or uninterrupted sleep. Compare Neon's
active-time chart over a full day after deployment, rather than counting idle
connections or treating cumulative query counters as a rate.
