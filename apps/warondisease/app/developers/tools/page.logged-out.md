# /developers/tools

## Metadata

- Page title: MCP Tool Reference
- Meta description: Every tool the Optimitron MCP server exposes, with its required OAuth scope, admin gate, and parameters.
- Canonical: https://warondisease.org
- Open Graph title: The International Campaign to End War and Disease
- Open Graph description: Click a glowing rectangle. 15 seconds. 2.6 lives saved + 53 years of suffering prevented.
- Open Graph image: https://warondisease.org/assets/warondisease/war-on-disease-og-1200x630.png
- Twitter title: The International Campaign to End War and Disease
- Twitter description: Click a glowing rectangle. 15 seconds. 2.6 lives saved + 53 years of suffering prevented.

## Visible Page Copy

- DEVELOPERS
## MCP TOOL REFERENCE
- Every tool the Optimitron MCP server exposes — 171 tools (32 admin-gated) — generated from the same registry the live server enforces. The live machine-readable version is [optimitron.com/api/mcp/tools](https://optimitron.com/api/mcp/tools); connection instructions live at [/mcp](/mcp).
- Each tool is listed once, under its primary scope; many accept more than one scope, so the badges on a tool name every scope that can call it.
### OAUTH SCOPES
### PUBLIC (NO SCOPE) (15)
#### getNextTask
- Get the highest expected-value unblocked task that the caller can work on. Returns the single best task to execute right now.
- PARAMETERS (8)
- skillTags (array) — Agent's skill tags for personalized ranking
- interestTags (array) — Agent's interest tags for personalized ranking
- credentialTags (array)
- languageTags (array)
- toolTags (array)
- accessTags (array)
- availableHoursPerWeek (number) — Hours per week the agent can commit
- agentId (string) — Agent's unique identifier (to skip tasks leased by this agent)
#### evaluateTaskEconomics
- Evaluate the execution economics for a single task. Returns whether the current agent should execute directly, delegate, prepare procurement, or raise money first.
- taskId (string, required) — Task ID
- skillTags (array) — Agent's skill tags for capability matching
- interestTags (array) — Agent's interest tags for capability matching
#### listTasks
- List tasks with optional filters. Returns up to 50 tasks sorted by accountability score. Signed-in callers see public tasks plus their own private work by default (visibility 'all'); pass visibility 'public' or 'private' to narrow. Returns the legacy task array unless paginated=true or cursor is supplied. Paginated inventory uses immutable task-ID order, not priority order.
- PARAMETERS (17)
- visibility (enum) — Which tasks to include: 'all' = public + your private work (default when signed in), 'public' = public only (default for anonymous callers), 'private' = only your non-public tasks.
- status (enum) — Filter by task status
- category (enum) — Filter by task category
- assigneePersonId (string) — Filter by assignee person ID
- assigneeOrganizationId (string) — Filter by assignee organization ID
- ownerOrganizationId (string) — Filter by owner/reviewer organization ID
- engagementKind (enum) — Filter by engagement kind.
- applicationPolicy (enum) — Filter by application policy.
- compensationKind (enum) — Filter by compensation kind.
- remotePolicy (enum) — Filter by remote/hybrid/onsite policy.
- executionMode (enum) — Filter by human/agent execution mode.
- requiredTags (array) — Return tasks whose required/preferred/skill tags include any supplied tag.
- assignedToMe (boolean) — Filter to tasks assigned to the authenticated user's canonical Person row.
- parentTaskId (string) — Filter by parent task ID (get subtasks)
- cursor (string) — Opaque cursor returned as nextCursor by the preceding page. Copy it verbatim and keep all filters unchanged.
- paginated (boolean) — Return {tasks,nextCursor}. Omit for the legacy task-array response.
- limit (integer) — Max results (default 20, max 50)
#### getTask
- Get task details by taskId with one canonical impact frame. Call getTaskImpactTrace for formulas and provenance. If you do not have a taskId yet, call searchTasks, listTasks, getMyQueue, or getNextAction first.
- PARAMETERS (1)
#### listOrganizations
- List organizations (for example to create task targets), optionally including active/target-filtered tasks.
- PARAMETERS (9)
- query (string) — Search query for name, slug, description, website, or contact email.
- type (enum) — Optional organization type filter.
- status (enum) — Optional organization status filter.
- includeTasks (boolean) — Include a short active task summary for each organization (default false).
- limit (number) — Max organizations to return (default 100, max 500).
- taskLimit (number) — Max tasks per organization when includeTasks=true (default 3, max 50).
- taskVisibility (enum) — Which tasks to include in the summary: 'all' = public + your private work (default when signed in), 'public' = public only (default for anonymous callers), 'private' = only your non-public tasks.
- taskScope (enum) — Deprecated alias of taskVisibility ('accessible' = 'all'). Prefer taskVisibility.
- taskStatus (enum) — Task status used when includeTasks=true (default ACTIVE).
#### getOrganizationTasks
- List tasks currently assigned to a specific organization.
- PARAMETERS (5)
- organizationId (string, required) — Organization ID.
- limit (number) — Max tasks to return (default 50, max 200).
- scope (enum) — Deprecated alias of visibility ('accessible' = 'all'). Prefer visibility.
- status (enum) — Optional task status filter.
#### listPeople
- List people (optionally public-figure-only) and optionally include their assigned active tasks.
- query (string) — Search by display name, handle, current affiliation, source ref, or email.
- publicProfilesOnly (boolean) — When true, only includes people marked as public-figure profiles (default true).
- includeTasks (boolean) — Include a short active task summary for each person (default false).
- limit (number) — Max people to return (default 100, max 500).
- taskLimit (number) — Max tasks per person when includeTasks=true (default 3, max 50).
#### getPersonTasks
- List tasks currently assigned to a specific person.
- personId (string, required) — Person ID.
#### inspectToolAccess
- Explain which MCP tools this connection can use and why. Optionally filter by tool name. Returns effective scopes, server identity, and stable access reason codes without exposing token data.
- toolNames (array) — Optional tool names to inspect. Omit to inspect the complete compact catalog.
#### listReferendums
- List Optimitron referendums. Public callers see active referendums by default; admins can filter by DRAFT, ACTIVE, or CLOSED.
- PARAMETERS (3)
- status (enum) — Referendum status filter. Defaults to ACTIVE.
- query (string) — Optional search over title, slug, and description.
- limit (number) — Max referendums to return (default 20, max 100).
#### listSitePages
- Return a structured inventory of pages for configured Optimitron-owned domains. Agents should call this before creating a new page.
- site (string) — Optional domain filter, e.g. optimitron.com, warondisease.org, dfda.earth, dih.earth, or manual.warondisease.org.
#### getPageContent
- Return the fully rendered logged-out text for an Optimitron-owned page as clean markdown, with its title, section headings, and last-modified metadata. Checked-in rendered snapshots are preferred so client-side loading shells are never mistaken for page content; this public reader does not expose authenticated page text.
- url (string, required) — Full URL of an allowed page.
#### searchManual
- Search the Optimitron manual, disease eradication plan, and related documentation. Returns relevant context with citations.
- PARAMETERS (2)
- query (string, required) — Search query (e.g. 'FDA approval timeline', 'RAPPA preference aggregation')
- maxResults (number) — Max results to return (default 5)
#### askWishonia
- Ask Wishonia a question — she answers in character using retrieved documentation from the Optimitron manual and disease eradication plan.
- question (string, required) — Your question for Wishonia
#### searchTasks
- Fuzzy-search your accessible tasks by title, description, impact statement, task key, assignee, or organization. Signed-in results may include public tasks and private tasks you created, manage, are assigned, claimed, or can access through an organization; other users' private work remains excluded. Use this before createTask/updateTask to find parents, duplicates, blockerTaskIds, or blockedTaskIds. Long snippets are capped at 200 characters and include a getTask instruction for reading the full description. For Optimitron code or documentation work, query the stable key 'optimitron:dev', select that exact result, and call createTask with parentTaskKey='optimitron:dev'. Returns the legacy result array unless paginated=true or cursor is supplied. Paginated inventory uses immutable task-ID order, not relevance order.
- PARAMETERS (7)
- query (string, required) — Search query text.
- cursor (string) — Opaque cursor returned as nextCursor by the preceding page. Copy it verbatim and keep query and filters unchanged.
- paginated (boolean) — Return {tasks,nextCursor}. Omit for the legacy result-array response.
- limit (number) — Max results to return (default 20, max 100)
- visibility (enum) — Which tasks to search: 'all' = public + your private work (default when signed in), 'public' = public only (default for anonymous callers), 'private' = only your non-public tasks.
- status (enum) — Optional status filter to narrow dependency candidates.
### TASKS:PERSONAL (91)
#### recordMeasurement tasks:personal
- Record a personal dFDA/N-of-1 measurement such as a medication dose, food, symptom, mood, sleep, activity, lab, or vital sign. Use variableName plus category/unit for new variables, or globalVariableId for an existing variable.
- PARAMETERS (15)
- globalVariableId (string)
- variableName (string)
- categoryName (string) — Required when variableName does not already exist. Examples: Treatment, Food, Drink, Nutrient, Symptom, Emotion, Sleep, Activity, Vital Sign, or Biomarker.
- value (number, required)
- unitId (string)
- unitAbbreviation (string) — Short unit such as mg, IU, servings, count, or 1-5. serving and {serving} are accepted aliases for servings.
- unitName (string) — Full unit name; matched case-insensitively.
- startTime (string) — ISO date/time.
- duration (number) — Duration in seconds.
- note (string)
- sourceName (string)
- combinationOperation (enum)
- fillingType (enum)
- latitude (number)
- longitude (number)
#### listMeasurements tasks:personal
- List the authenticated user's own recorded measurements, newest first. Covers everything logged through recordMeasurement or a tracking-reminder response. Filter by globalVariableId or variableName for one variable, or omit both to see every variable. Use this to review logged doses, foods, symptoms, moods, sleep, activity, labs, and vitals, or to check whether a reminder was actually answered. Each row carries startTime (UTC) and startTimeLocal (the user's zone): report times to the user from startTimeLocal.
- PARAMETERS (6)
- variableName (string) — Variable name, matched case-insensitively. An unknown variable is an error, not an empty result.
- startTimeAfter (string) — ISO date/time. Only measurements at or after this time.
- startTimeBefore (string) — ISO date/time. Only measurements at or before this time.
- limit (number) — Page size. Default 100, maximum 500.
- cursor (string) — nextCursor from the previous page. Repeat the same filters until nextCursor is null.
#### updateMeasurement tasks:personal
- Correct one of the authenticated user's measurements by ID. Use listMeasurements to get the ID. Pass value in the normalized unit. If the measurement was converted between units, also pass originalValue in its original unit. Units and variable identity stay unchanged. Optional metadata fields patch the existing row. The tool rejects measurements owned by another user and refreshes cached summaries.
- measurementId (string, required)
- originalValue (number) — Corrected value in the existing original unit. Required when originalUnitId differs from unitId; otherwise defaults to value.
- duration (number | null) — Duration in seconds. Null clears it.
- note (string | null)
- sourceName (string | null)
- latitude (number | null)
- longitude (number | null)
#### deleteMeasurement tasks:personal
- Soft-delete one of the authenticated user's measurements by ID. Use listMeasurements to get the ID. The tool rejects measurements owned by another user and refreshes cached summaries.
#### upsertTrackingReminder tasks:personal
- Create or edit a personal tracking reminder for medications, food, symptoms, mood, sleep, activity, labs, or vitals. When creating a new variable, pass categoryName; Food defaults to servings. To edit a reminder in place, pass trackingReminderId plus only the fields to change. Omit trackingReminderId to create or idempotently update the reminder identified by variable, start time, and frequency. Unit fields set your personal recording unit for the variable; the canonical variable default is unchanged. The response's top-level unit is the unit answers record in. The reminder can later be answered as TRACKED (value 0 for a not-taken day) or SNOOZED.
- trackingReminderId (string) — Existing reminder ID to edit in place. Patchable: active, defaultValue, instructions, reminderStartTime, reminderEndTime, reminderFrequency, startTrackingDate, stopTrackingDate, unit fields, and fillingType. Fixed at creation: the tracked variable (variableName, globalVariableId, categoryName, combinationOperation) — to change it, create a new reminder and set active: false on this one.
- defaultValue (number | null) — Pre-filled value, such as a normal medication dose or symptom rating. Pass null to clear it when editing.
- unitAbbreviation (string) — Short unit such as mg, IU, servings, count, or 1-5. serving and {serving} are accepted aliases for servings. Sets your personal recording unit for this variable, on create or on edit.
- reminderStartTime (string) — Local wall-clock time in HH:mm, for example 08:00.
- reminderEndTime (string | null) — Optional local end/quiet time in HH:mm. Pass null to clear it when editing.
- reminderFrequency (number) — Seconds between reminders. Default 86400.
- active (boolean)
- instructions (string | null)
- startTrackingDate (string | null) — ISO date/time, or null to clear it when editing.
- stopTrackingDate (string | null) — ISO date/time, or null to clear it when editing.
#### listTrackingReminders tasks:personal
- List the authenticated user's personal tracking reminders, active by default. Returns a compact shape by default: id, name, schedule, defaultValue, recording unit, fillingType, and an instructions preview. Pass compact: false for full records. Use getTrackingReminder for one reminder with full instructions.
- includeInactive (boolean)
- compact (boolean) — Defaults to true. Pass false for full records with expanded variable and unit objects and untruncated instructions.
#### getTrackingReminder tasks:personal
- Get one of the authenticated user's tracking reminders in full, including untruncated instructions, the expanded variable, and the effective recording unit. Use listTrackingReminders to find the ID.
- trackingReminderId (string, required)
#### listTrackingReminderNotifications tasks:personal
- List the authenticated user's tracking notification queue for one local day or an inclusive local-date range. A reminder defines a schedule; a notification is one occurrence. Filter by trackingReminderId or effective status, including OVERDUE. The default compact shape carries id (the trackingReminderId to answer with), name, due (local time), status, defaultValue, unit, and fillingType, so an agent can answer without a second lookup. An OVERDUE item with sameDayMeasurementCount already has same-day data for its variable recorded outside this notification: verify with listMeasurements before answering again, or you may duplicate data. Pass compact: false for full records with scheduledAt, effective notifyAt, and snoozedUntil. Set includeCompleted to include recent TRACKED notifications.
- dateKey (string) — One local date in YYYY-MM-DD. Defaults to today. Do not combine with startDateKey or endDateKey.
- startDateKey (string) — First local date in an inclusive range. Defaults to endDateKey when omitted.
- endDateKey (string) — Last local date in an inclusive range. Defaults to startDateKey when omitted. Ranges may include at most 31 days.
- trackingReminderId (string) — Return occurrences for only this reminder.
- status (enum) — Return only this effective status. An elapsed snooze becomes PENDING or OVERDUE. OVERDUE means effective notifyAt is in the past and the occurrence remains unanswered.
- compact (boolean) — Defaults to true. Pass false for full records including scheduledAt, snooze detail, and instructions.
- includeCompleted (boolean) — Include answered TRACKED or legacy SKIPPED occurrences. SNOOZED occurrences are always returned with snoozedUntil.
#### listDueTrackingReminders tasks:personal
- Deprecated alias for listTrackingReminderNotifications. It keeps the reminders response key for existing callers.
- dateKey (string) — Local date in YYYY-MM-DD. Defaults to today.
- compact (boolean) — Return trackingReminderId as id, plus name, due, and status.
- includeCompleted (boolean) — When true, include reminders already answered or snoozed for the date.
#### respondToTrackingReminderNotifications tasks:personal
- Answer several tracking reminder notifications in one call. To answer specific reminders, send only except entries and omit defaultStatus; every other reminder stays untouched. Send defaultStatus only when you intend to answer the whole day. An except entry can also correct a response you already recorded. All-or-nothing: if any exception ID is not scheduled for the date, the tool writes nothing and returns an error. The call targets one local date; when catching up a past day (for example after midnight), pass that day's dateKey. Each result reports notifyAtLocal, the occurrence the answer landed on: verify it is the day you meant.
- defaultStatus (enum) — Optional. Apply this status to every due and unanswered notification without an exception. Omit it to answer only the except entries. Already-answered notifications are never touched by the default.
- except (array) — Answer or correct individual notifications by trackingReminderId. Each entry needs a status when defaultStatus is omitted.
- snoozeMinutes (number) — Set the snooze duration. The default is 30 minutes. The server caps the deferred time at the local day's end.
#### respondToTrackingReminder tasks:personal
- Answer a due tracking reminder. TRACKED records a measurement. Record value 0 when the treatment, food, or activity was not taken; those zero days are the baseline that causal analysis needs. SNOOZED defers the notification. Deactivate the reminder when it no longer applies. SKIPPED is retired: it now records a zero and returns a deprecation notice. When dateKey and trackedAt are omitted, the answer targets the reminder's most recent due occurrence within the last 7 days that is still unanswered — so an after-midnight catch-up resolves yesterday's occurrence, not tomorrow's. The response's notifyAtLocal shows where the answer landed.
- PARAMETERS (11)
- status (enum, required) — TRACKED records a measurement; pass value 0 for a not-taken day. SNOOZED defers the notification. SKIPPED is accepted but retired and records a zero.
- value (number) — Override dose/rating/value. If omitted for TRACKED, the reminder defaultValue is used.
- unitAbbreviation (string)
- unitName (string)
- trackedAt (string) — ISO date/time the measurement actually happened. Also anchors the target day when dateKey is omitted.
- dateKey (string) — Local date in YYYY-MM-DD of the occurrence to answer. Defaults from trackedAt when given, else to the most recent unanswered due occurrence.
#### getQueueAudit tasks:personal or tasks:organization
- Start here before trusting a personal task queue. Audits active private tasks created by this user or assigned to their Person for missing estimates, blocked dependencies, impossible priority inputs, required/expiring deadline risks, and other data issues. A life-planning agent should repair or clarify high-severity issues before relying on getNextAction.
- NO PARAMETERS
#### getMyQueue tasks:personal or tasks:organization
- Get the authenticated user's available private self-work in two lanes. deadlineLane contains unblocked REQUIRED or EXPIRES work that is past due or past latest-start, sorted most-overdue first and never truncated by maxResults. evLane contains all other executable work in the existing expected-value order and is limited by maxResults. Returns tasks the user created OR has been assigned to (via assigneePersonId).
- maxResults (number) — Max number of evLane tasks to return (default 20, max 100). Does not truncate deadlineLane.
- buybackRate (number) — USD per hour used to convert cash cost into time-equivalent penalty (default 1000)
#### getAIQueue tasks:personal or tasks:organization
- Get the authenticated user's available private AI-agent tasks that fit one bounded execution attempt, sorted by computed priority. Oversized leaves appear in itemsNeedingDecomposition. Use executor_type='AI Agent' for autonomous work; otherwise use executor_type='Self'.
- agentId (string) — Current agent ID. Required to see this agent's own leased tasks: any leased task is omitted unless agentId is passed and matches the lease holder.
- maxResults (number) — Max number of tasks to return (default 20, max 100)
#### getExecutionPlan tasks:personal or tasks:organization
- Build a capacity-bounded execution plan for the authenticated user, their Person record, or an organization they administer. Uses frontier-replanning-v1: repeatedly chooses the highest-priority feasible atomic task, simulates completion to unlock dependencies, and never starts AI work or writes Calendar events.
- target (object)
- planningWindowStart (string) — ISO 8601 start. Defaults to now.
- planningWindowEnd (string) — ISO 8601 end. Defaults to 24 hours after start.
- fixedCommitments (array) — Calendar meetings or invitations that consume capacity but are not imported as tasks.
- availableMinutes (number) — Maximum work minutes. The planner also caps this at free time left after fixed commitments.
- maxResults (number) — Maximum checklist and AI proposal items (default 20, max 100).
- buybackRate (number) — USD per hour used to convert cash cost into time-equivalent penalty (default 1000).
#### getNextAction tasks:personal or tasks:organization
- Get the best next self-work action from the same two-lane result as getMyQueue. Returns the most-overdue deadlineLane task whenever that lane is non-empty; otherwise returns the highest-ranked evLane task.
#### recordTaskActuals tasks:personal or tasks:organization or tasks:admin
- Append an execution-history attempt and update aggregate actual cash cost and effort. Personal callers may record actuals only for their own private or assigned tasks; this does not create health measurements or run causal analysis.
- actualCashCostUsd (number) — Observed external cash cost in USD
- actualEffortSeconds (number) — Observed effort in seconds
- note (string) — Short execution note or procurement/funding rationale
- completedAt (string) — ISO 8601 completion time. Defaults to now.
#### findTasksForUser tasks:personal or tasks:admin
- Rank accessible active tasks for a user using their private matching preferences plus the task impact score. Non-admin callers can only rank their own user.
- userId (string) — Optional target user ID. Admin-only unless it is the authenticated user.
- limit (number) — Max results, default 20, max 50.
- preferLeafExecution (boolean) — When true, return only executable tasks without active subtasks; never fall back to parent tasks.
#### applyToTask tasks:personal
- Create or update the authenticated user's application to an OPEN or INVITE_ONLY task/role opening.
- taskId (string, required) — Task or role opening ID.
- applicationMessage (string) — Applicant message, cover note, or proposal.
- answersJson (object | array | null) — Structured answers to task.applicationQuestionsJson.
- applicantNameSnapshot (string) — Optional applicant name snapshot.
- applicantEmailSnapshot (string) — Optional applicant email snapshot.
- originUrl (string) — Where the application started.
- utmJson (object | null) — UTM/campaign metadata.
#### listTaskApplications tasks:personal or tasks:admin
- List applications for one task. Caller must be admin, task creator, task manager, or owner/admin of the owner/assignee organization.
- taskId (string, required) — Task ID.
#### reviewTaskApplication tasks:personal or tasks:admin
- Review one task application. Optionally assign the task to the accepted applicant's Person row.
- applicationId (string, required) — Application ID.
- status (enum) — New application status.
- reviewScore (integer | null) — Reviewer score, conventionally 0-100.
- reviewNote (string | null) — Reviewer note.
- answersJson (object | array | null) — Reviewer-normalized answer data.
- assignTaskOnAccept (boolean) — If status is ACCEPTED, set task.assigneePersonId to the applicant person.
#### listTaskCandidateMatches tasks:personal or tasks:admin
- List saved candidate matches for a task. Non-admin callers must have application-review rights for the task.
- taskId (string, required)
- status (enum)
- limit (number) — Max results, default 50.
#### listCommunications tasks:personal or tasks:admin
- List task communications (email, in-app, external URL, manual) across all channels. Admins see everything; other callers see only communications on tasks they created or are assigned to, with recipient emails masked (m***@domain). Suppressed sends surface as FAILED/CANCELLED rows with a suppressionReason.
- taskId (string) — Filter to one task.
- organizationId (string) — Filter by recipient organization ID.
- personId (string) — Filter by recipient person ID.
- sinceIso (string) — Only rows created at or after this ISO-8601 timestamp.
- untilIso (string) — Only rows created at or before this ISO-8601 timestamp.
- channel (enum) — Filter by communication channel.
- status (enum) — Filter by lifecycle status.
- limit (number) — Max rows to return (default 50, max 200).
#### getCommunicationLog tasks:personal or tasks:admin
- Fetch one task communication by ID: full message body (via the linked task comment), envelope metadata, email delivery details (provider IDs, delivery status), and trigger/idempotency metadata. Same visibility and masking rules as listCommunications.
- id (string, required) — TaskCommunication ID.
#### getMe tasks:personal or tasks:organization
- Return the authenticated user's profile (User + canonical Person row). Use this to discover who you are acting as: userId, email, displayName, handle, avatar, bio, headline, website, social links, and visibility flags. No arguments — identity is taken from the OAuth bearer token.
#### updateMyProfile tasks:personal
- Update the authenticated user's profile. Person is canonical for the public-facing fields (displayName, handle, bio, headline, coverImage, website, isPublic); this tool writes Person directly. Only fields you supply are changed. Pass `handle: ""` (or null) to clear the handle. Returns the fresh profile.
- PARAMETERS (28)
- name (string) — Display name shown across the app.
- image (string | null) — Profile avatar image URL.
- handle (string | null) — Player-name handle, 3–24 chars, [A-Za-z0-9_-]. Empty/null clears it. Must be unique.
- bio (string) — Short bio.
- headline (string | null) — Optional one-line headline shown above the bio.
- website (string | null) — Personal/profile URL.
- coverImage (string | null) — Profile cover image URL.
- isPublic (boolean) — Whether the profile is publicly visible.
- newsletterSubscribed (boolean) — Whether to receive the newsletter.
- unsubscribedScopes (array) — Email scopes to opt out of (transactional/master scopes are filtered out server-side).
- skillTags (array)
- interestTags (array)
- preferredPaymentRails (array)
- workPreferenceTags (array)
- preferredTaskTags (array)
- unavailableTaskTags (array)
- availableHoursPerWeek (number | null)
- availableFrom (string | null) — ISO 8601 date.
- countryCode (string | null)
- regionCode (string | null)
- city (string | null)
- postalCode (string | null)
#### createTask tasks:personal or tasks:organization or tasks:admin
- Create an ACTIVE task. Visibility defaults to PRIVATE; admin organization assignments default PUBLIC. Only admins may create PUBLIC tasks. Required: title, description, one parentTaskId or parentTaskKey, taskKey, category, hours, value, p_success, acceptanceCriteria, and impactStatement. Call getMe first: personalRoot is the caller's private Optimize-{name} root and organizationRoots lists accessible organization roots. Choose the closest parent; use personalRoot.taskKey only for personal work. Never guess or default. Optimize Earth is reserved. For Optimitron code or documentation improvements, search for duplicate work and set parentTaskKey='optimitron:dev'. Estimate instead of omitting numbers. Use testable acceptance criteria and one sentence explaining impact. Reference tasks as titled Markdown links to https://optimitron.com/tasks/<id>, never as bare IDs. Use depends_on for true prerequisites; executor_type='Self' for user work and 'AI Agent' only for autonomous assistant work; deadline_policy='REQUIRED' for must-do legal/health/safety tasks and 'EXPIRES' for opportunities that vanish after due_at. taskKey is the idempotency key: retrying the same create returns the existing task instead of creating a duplicate. The response includes a writeReceipt and a missingFields[] array for soft-recommended metadata.
- PARAMETERS (79)
- title (string) — Short imperative title
- description (string) — Full explanation and acceptance criteria
- parentTaskId (string) — Existing parent task ID. Provide this or parentTaskKey, not both. Call getMe for personalRoot and organizationRoots, then choose the closest objective or task; do not use Optimize Earth directly.
- parentTaskKey (string) — Exact stable key of the existing parent task. Provide this or parentTaskId, not both. For personal work use getMe.personalRoot.taskKey; for Optimitron development work use 'optimitron:dev'.
- taskKey (string) — Stable dedup key (e.g. accountability:us:golf-2025)
- category (enum) — Task category
- skillTags (array) — Skills needed
- interestTags (array) — Related topics/causes
- engagementKind (enum) — Commitment shape: ONE_OFF, ONGOING, PART_TIME, FULL_TIME, CONTRACT.
- applicationPolicy (enum) — Whether users can apply: CLOSED, OPEN, or INVITE_ONLY.
- preferredSkillTags (array) — Skills that improve fit beyond required skillTags.
- requiredCredentialTags (array) — Credentials, licenses, or qualifications required.
- preferredCredentialTags (array) — Credentials that improve fit.
- requiredLanguageTags (array) — Languages required.
- preferredLanguageTags (array) — Languages that improve fit.
- requiredToolTags (array) — Tools, platforms, or software required.
- preferredToolTags (array) — Tools that improve fit.
- requiredAccessTags (array) — Accounts, clearance, location, network, or social access required.
- preferredAccessTags (array) — Access that improves fit.
- ownerOrganizationId (string | null) — Organization that owns/reviews this opening or task.
- compensationKind (enum) — Compensation category.
- compensationCadence (enum) — Compensation cadence. Null clears it.
- compensationCurrency (string | null) — Lowercase currency code, usually usd.
- compensationMinAmountMinorUnits (integer | null) — Minimum compensation in currency minor units.
- compensationMaxAmountMinorUnits (integer | null) — Maximum compensation in currency minor units.
- compensationMinAmountUsd (number | null) — Minimum compensation in whole US dollars; the server converts to minor units (cents). USD alternative to compensationMinAmountMinorUnits.
- compensationMaxAmountUsd (number | null) — Maximum compensation in whole US dollars; the server converts to minor units (cents). USD alternative to compensationMaxAmountMinorUnits.
- compensationPaymentRails (array) — Acceptable payment rails, such as stripe, ach, usdc, wire.
- estimatedHoursPerWeekMin (integer | null) — Minimum weekly hours for ongoing work.
- estimatedHoursPerWeekMax (integer | null) — Maximum weekly hours for ongoing work.
- remotePolicy (enum) — UNSPECIFIED, REMOTE, HYBRID, or ONSITE.
- locationText (string | null) — Human-readable location constraint.
- workLocationCountryCode (string | null)
- workLocationRegionCode (string | null)
- workLocationCity (string | null)
- workLocationPostalCode (string | null)
- workLocationLatitude (number | null)
- workLocationLongitude (number | null)
- workLocationRadiusKm (number | null)
- workTimeZone (string | null) — IANA time zone preferred for the work.
- applicationQuestionsJson (object | array | null) — Structured questions for applicants. Null clears it.
- executionMode (enum) — HUMAN_OR_AGENT, HUMAN_ONLY, or AGENT_ONLY.
- maxClaims (integer | null) — Max simultaneous claims when claimPolicy is OPEN_MANY.
- depends_on (array) — Alias for blockerTaskIds: existing task IDs that must be VERIFIED before this task appears in active queues. Use only for real prerequisites, not generic importance.
- blockerTaskRefs (array) — Prerequisite task IDs or exact taskKeys.
- blockerTaskIds (array) — Optional IDs of existing tasks that block this task (must be completed first). Use searchTasks first to discover valid blocker task IDs.
- blockedTaskRefs (array) — Blocked task IDs or exact taskKeys.
- blockedTaskIds (array) — Optional IDs of existing tasks that are blocked by this task (tasks that depend on it). Use searchTasks first to discover valid dependent task IDs.
- estimatedEffortHours (number) — Estimated hours to complete
- hours (number) — Alias for estimatedEffortHours. Required for reliable priority; use expected user hours, not calendar duration.
- value (number) — Gross conditional value if the task succeeds. For required tasks, include avoided downside such as penalties, health loss, or system failure.
- p_success (number) — Success probability, 0-1. MCP computes expected value as value * p_success when value is supplied.
- cash_cost (number) — Cash cost in USD. Priority converts this to hour-equivalent cost using buybackRate, default $1000/hr.
- executor_type (enum) — Who should execute this task. Use Self for normal user tasks even if AI assists; use AI Agent only for autonomous assistant tasks.
- expectedEconomicValueUsdBase (number) — Expected economic value in USD-equivalent welfare (probability-adjusted by your model)
- successProbabilityBase (number) — Estimated success probability for the task outcome, 0-1
- estimatedCashCostUsdBase (number) — One-time cash cost expected to execute this task (USD)
- timeToImpactStartDays (number) — Days until value can start being realized. Metadata/public impact-frame input; not part of personal priority.
- available_at (string) — Earliest time this task should appear in active queues (ISO 8601). Use for tasks that cannot or should not be started yet.
- dueAt (string) — Due date (ISO 8601)
- due_at (string) — Alias for dueAt
- deadline_policy (enum) — Whether due_at is ignored, a soft target, an expiring opportunity, or required work. REQUIRED is for must-do tasks like taxes or medicine refills; EXPIRES is for grants/applications/opportunities that vanish after due_at.
- deadline_rationale (string) — Freeform rationale for the deadline policy, e.g. taxes must be filed by a legal deadline.
- claimPolicy (enum) — How work is claimed. Assigned tasks always use ASSIGNED_ONLY. Unassigned tasks default to OPEN_SINGLE; use OPEN_MANY only for ongoing independent contributions.
- assigneePersonId (string) — Person ID to assign this task to
- assigneeOrganizationId (string) — Organization ID to assign this task to
- roleTitle (string) — Role of the assignee (e.g. President, Commissioner)
- sourceUrl (string) — URL to the source/evidence for this task
- contactUrl (string) — URL for contacting the assignee
- contactLabel (string) — Label for the contact channel
- impactStatement (string) — Why this matters
- ev_math (string) — Freeform rationale for value/probability/hour assumptions
- can_delegate (boolean) — Whether an agent or contractor can do this task
- best_route (string) — Best execution route, e.g. self, agent, contractor
- acceptanceCriteria (array) — Structured acceptance criteria. If omitted, createTask also extracts checklist bullets under a markdown 'Acceptance criteria' heading in description.
- visibility (enum) — Optional visibility override. Defaults to PUBLIC for organization-assigned tasks and PRIVATE otherwise.
- isPublic (boolean) — Legacy boolean visibility alias. Prefer visibility='PUBLIC' or 'PRIVATE'. Ignored when visibility is supplied.
- contextJson (object) — Optional advanced task metadata. Prefer the typed top-level task fields.
- sortOrder (number) — Manual display order for public/task-tree views (lower = earlier). Not the computed personal priority score.
#### deleteTask tasks:personal or tasks:organization or tasks:admin
- Delete a task by soft delete. Admins may delete any task within the client boundary. Non-admin callers may delete only a private task they have MANAGE access to; a public task is always rejected for non-admin callers with 'Deleting public tasks requires an admin user.', even though they can look one up by ID without MANAGE access.
- taskId (string, required) — Task ID to delete
#### proposeTaskBundle tasks:personal or tasks:organization or tasks:admin
- Propose a bundle of tasks for review. Creates each as DRAFT, runs validation, returns review decisions. Does NOT auto-promote.
- candidates (array, required) — Tasks to propose
#### promoteTask tasks:personal or tasks:organization or tasks:admin
- Promote reviewed DRAFT tasks to ACTIVE. Promotion reruns governance review and rejects tasks that fail the current checks.
- proposalRefs (array, required) — Proposal refs (task IDs or taskKeys) to promote
#### updateTask tasks:personal or tasks:organization or tasks:admin
- Update task metadata, estimates, ancestry, dependencies, deadline, or executor. Reparent with exactly one of parentTaskId or parentTaskKey. Reference tasks in descriptions as titled Markdown links to https://optimitron.com/tasks/<id>, never as bare IDs. Completion and verification use the execution tools. Passing depends_on replaces the blocker set idempotently, so keep it complete.
- PARAMETERS (68)
- claimPolicy (enum) — How work is claimed. Use ASSIGNED_ONLY for a named person or organization, OPEN_SINGLE for one claim that completes the task, and OPEN_MANY only for ongoing independent contributions.
- title (string)
- description (string)
- parentTaskId (string) — Existing rooted parent task ID. Provide this or parentTaskKey, not both. Search first; cannot be Optimize Earth or create a hierarchy cycle.
- parentTaskKey (string) — Exact stable key of the existing rooted parent task. Provide this or parentTaskId, not both. Call getMe for personalRoot and organizationRoots.
- impactStatement (string)
- category (enum) — Re-categorize the task. Affects category-filtered listTasks queries; not part of personal priority score.
- taskKey (string) — Stable dedup key
- assigneePersonId (string) — Person ID to assign (use empty string to clear)
- assigneeOrganizationId (string) — Organization ID to assign (use empty string to clear)
- roleTitle (string) — Role of the assignee
- sourceUrl (string) — URL to the source/evidence
- available_at (string) — Earliest time this task should appear in active queues (ISO 8601), use empty string to clear
- dueAt (string) — Due date (ISO 8601), use empty string to clear
- due_at (string) — Alias for dueAt, use empty string to clear
- deadline_policy (enum) — Whether dueAt is ignored, a soft target, an expiring opportunity, or required work.
- deadline_rationale (string) — Freeform rationale for the deadline policy.
- contextJson (object) — Optional advanced task metadata merged with existing contextJson.
- depends_on (array) — Replace blocker dependencies with this exact list of task IDs. Blockers must be completed/VERIFIED before this task appears in active queues.
- blockerTaskRefs (array) — Replace blockers using task IDs or exact taskKeys.
- blockerTaskIds (array) — Replace blocker dependencies with this exact list of task IDs.
- hours (number) — Alias for estimatedEffortHours. Keep this current when task scope changes.
- value (number) — Gross conditional value if the task succeeds. Update when the upside/downside estimate changes.
- p_success (number) — Success probability, 0-1. Update after new information changes the odds.
- cash_cost (number) — Cash cost in USD. Update if execution cost changes.
- executor_type (enum) — Who should execute this task. Use Self for normal user tasks even with AI assistance; AI Agent means autonomous assistant work.
- acceptanceCriteria (array) — Structured acceptance criteria. If omitted while description is updated, updateTask can extract checklist bullets under a markdown 'Acceptance criteria' heading.
#### searchParameters tasks:personal or earthdata:write
- Search published parameters used by Optimitron calculations.
- query (string) — Key, display name, or description text.
- limit (number) — Maximum results (default 20, max 100).
#### getParameterTrace tasks:personal or earthdata:write
- Get one exact parameter revision with formula, uncertainty, pinned input revisions, source metadata, inert calculation code, assumptions, and publication state.
- revisionId (string) — Exact revision id. Preferred for reproducible traces.
- key (string) — Parameter key when looking up the current revision.
#### proposeParameterBundle tasks:personal or tasks:admin
- Create one or more immutable parameter revision drafts. Returns numerical diffs, formulas or inert calculation code, exact input revisions, and provenance for human review. This never publishes revisions.
- parameters (array, required)
#### reviewParameterRevision tasks:personal or tasks:admin
- Publish or reject one reviewed parameter revision.
- revisionId (string, required)
- action (enum, required)
#### proposeTaskImpact tasks:personal or tasks:admin
- Create an immutable task-impact draft with materialized values, formulas or inert calculation code, assumptions, and sources. Public drafts require admin review before use.
- PARAMETERS (14)
- frameKey (enum)
- frame (object)
- metrics (array)
- assumptions (array)
- formulaText (string)
- formulaLatex (string)
- calculationCode (string)
- calculationLanguage (string)
- sourceUrls (array)
- calculationSource (object) — Exact Python, notebook, or other calculation source to retain as inert content-addressed data. Optimitron stores but never executes it.
- estimateNotes (string)
- calculationVersion (string)
- methodologyKey (string)
#### getTaskImpactTrace tasks:personal or earthdata:write
- Trace the current or specified task-impact estimate through its formula, materialized values, recursive parameter tree, and source metadata.
- taskId (string)
- estimateSetId (string)
#### claimTask tasks:personal or tasks:organization
- Claim a task as the authenticated user.
- taskId (string, required) — Task ID to claim
#### claimSignerReminder tasks:personal
- Commit to reminding a specific head of state (or other 1% Treaty signer) to sign. Creates a private reminder subtask for you, parented to the signer task. The subtask carries an actionLink to a Google search for the signer's official contact, plus an outreach message template with your referral code embedded so any signer click-through credits you. Idempotent: calling twice with the same signer returns the existing subtask. The subtask auto-VERIFIES when the signer signs the treaty via your referral.
- signerTaskId (string, required) — Task ID of the parent signer task (e.g. 1-pct-treaty-signer-us). Use listTasks or searchTasks with status=ACTIVE to find candidates.
#### completeTask tasks:personal
- Mark one private Self task you own VERIFIED in a single call so it leaves your active queue. This owner-attestation shortcut is only for uncompensated, childless personal tasks that are unassigned or assigned only to you and have no formal work history. Use the submission-and-verification workflow for OPEN_MANY, delegated, shared, paid, public, organization, or agent work. If a one-person task was incorrectly stored as OPEN_MANY and has no formal history, update its claimPolicy to OPEN_SINGLE first.
- taskId (string, required) — Private Self task ID
- completionEvidence (string, required) — A short factual description of what was completed
#### completeTaskClaim tasks:personal or tasks:organization
- Claim an open task if needed, then mark only the authenticated user's claim completed. This does not itself complete the task. An authorized reviewer may later verify the claim; OPEN_SINGLE then resolves the task, while OPEN_MANY remains active for more contributions. Safe to retry after claim completion.
- completionEvidence (string, required) — What was done and proof it worked
#### addDependency tasks:personal or tasks:organization or tasks:admin
- Add a dependency between tasks. The blocked task cannot proceed until the blocker is done. Optional edge metadata can estimate how much the blocker raises downstream success probability or accelerates downstream value.
- PARAMETERS (12)
- blockedTaskRef (string) — Canonical task ID or exact taskKey for the task that is blocked.
- blockedTaskId (string) — Task that is blocked
- blockerTaskRef (string) — Canonical task ID or exact taskKey for the task that must complete first.
- blockerTaskId (string) — Task that must complete first
- probabilityDeltaBase (number) — Base probability lift, 0-1, produced by completing blockerTaskId for blockedTaskId.
- increases_p_success (number) — Alias for probabilityDeltaBase. Use for Notion-style 'this prerequisite raises downstream P(success)' estimates.
- timeDeltaDaysBase (number) — Base days of acceleration produced by completing blockerTaskId for blockedTaskId.
- time_delta_days (number) — Alias for timeDeltaDaysBase.
- assumptions (array) — Short assumptions behind the edge lift estimate.
- calculationVersion (string) — Optional version tag for the edge-lift calculation.
- label (string) — Optional note describing the dependency
- notes (string) — Optional note describing the dependency
#### getBlockers tasks:personal or tasks:organization
- Get all tasks blocking a given task, and all tasks this task blocks.
#### postTaskComment tasks:personal or tasks:organization
- Post a comment on a task. Message is GitHub-flavored markdown with these extensions: - Math: $inline$ or $$block$$ (rendered via KaTeX) - Diagrams: ```mermaid ... ``` fences (rendered via Mermaid) - Charts: ```chart { ...Chart.js config JSON... } ``` fences - Images: ![alt](url) inline - Tables, lists, strikethrough, code blocks, blockquotes — all standard Max length: 20,000 characters. Rate limit: 5 comments per task per hour. Posting a comment automatically sends comment notifications to task recipients and triggers a Wishonia auto-reply in the background.
- PARAMETERS (4)
- taskId (string, required) — Task ID to comment on
- parentCommentId (string) — Optional parent comment ID if this is a reply
- message (string, required) — Markdown body (1-20000 chars, supports math/mermaid/chart fences)
- mediaUrl (string) — Optional evidence URL (tweet, screenshot, article)
#### voteTaskComment tasks:personal or tasks:organization
- Upvote (+1), downvote (-1), or remove vote (0) on a task comment.
- commentId (string, required) — Comment ID to vote on
- value (number, required) — +1 upvote, -1 downvote, 0 remove vote
#### deleteTaskComment tasks:personal or tasks:organization
- Soft-delete your own comment (or any comment if you are a curator).
- commentId (string, required) — Comment ID to delete
#### getTaskComments tasks:personal or tasks:organization
- Fetch paginated comments for a task. Returns comments with vote scores, nested replies, and recent activity events.
- taskId (string, required) — Task ID to read comments for
- sort (enum) — 'new' (default) or 'top'
- cursor (string) — ISO timestamp cursor from a previous response's nextCursor
- limit (number) — Default 50, max 100
#### listTaskTemplates tasks:personal or tasks:admin
- List reusable task templates. This is a friendly view over TaskTrigger rows.
- eventName (string)
- enabled (boolean)
- jurisdictionId (string)
- limit (number) — Default 100, max 500
#### getTaskTemplate tasks:personal or tasks:admin
- Get one task template, including spawned task specs and recent fires.
- templateKey (string, required)
- recentFires (number) — How many recent fires to include. Default 10, max 100.
#### previewTaskTemplate tasks:personal or tasks:admin
- Render a task template for a target/context without writing anything. Use before enabling or assigning a template.
- targetPersonId (string) — Person ID to assign/render for. Adds context.target={kind:'person',id} and context.recipientPersonId.
- targetOrganizationId (string) — Organization ID to assign/render for. Adds context.target={kind:'organization',id} and context.organizationId.
- targetUserId (string) — User ID to render for. Adds context.target={kind:'user',id} and context.user.id.
- context (object) — Extra template context. Explicit fields here are preserved unless a target helper fills a missing field.
#### listTaskTriggers tasks:personal or tasks:admin
- List TaskTriggers, optionally filtered by eventName, enabled, or jurisdictionId. Returns triggerKey + summary fields, no specs.
#### getTaskTrigger tasks:personal or tasks:admin
- Get full details of a TaskTrigger by triggerKey, including all spec rows and the most recent fires.
- triggerKey (string, required)
#### fireTaskTrigger tasks:personal or tasks:admin
- Fire a TaskTrigger manually with arbitrary context. Use dryRun:true to render templates and return the planned spawn without committing — critical for iterating on a template before it goes live. Without dryRun: writes are committed and idempotent (re-firing the same idempotencyKey returns the cached result).
- context (object, required) — Arbitrary event context. Templates and resolvers read from this.
- dryRun (boolean) — Default false. True = render-only, no writes.
#### importNotionBundle tasks:personal or tasks:admin
- Validate and import a lossless Notion export bundle. Dry-run is the default; set dryRun to false only after reviewing the returned create, update, unchanged, and error items. Imported tasks remain private drafts, and formula or rollup definitions are preserved without execution.
- bundle (object, required)
- dryRun (boolean)
#### createCollection tasks:personal or tasks:admin
- Create a private structured collection with stable fields. Formula and rollup fields preserve imported definitions and outputs but are not executed.
- name (string, required)
- organizationId (string)
- visibility (enum)
- idempotencyKey (string, required)
- fields (array)
#### updateCollection tasks:personal or tasks:admin
- Update collection metadata with optimistic concurrency. Sharing and ownership still require full access.
- collectionId (string, required)
- expectedVersion (number, required)
- name (string)
#### getCollection tasks:personal or tasks:admin
- Get a collection schema, saved views, and effective permission.
#### listCollections tasks:personal or tasks:admin
- List collections the current user can see.
- limit (number)
#### createCollectionRecord tasks:personal or tasks:admin
- Create a collection record. Normal edits cannot write file, relation, formula, rollup, or canonical-entity fields through values; use relations for links.
- values (object, required)
- relations (array)
- taskId (string | null)
- personId (string | null)
- organizationId (string | null)
- documentId (string | null)
#### updateCollectionRecord tasks:personal or tasks:admin
- Update record values or relations and reject stale versions.
- recordId (string, required)
- values (object)
#### upsertCollectionRecordsBatch tasks:personal or tasks:admin
- Atomically create or update up to 100 collection records. Creates require stable idempotency keys; updates require the expected record version. Any invalid or stale operation rolls back the entire batch.
- operations (array, required)
#### queryCollectionRecords tasks:personal or tasks:admin
- Query collection records with bounded filters, ordered sorts, cursor pagination, and linked-entity authorization.
- cursor (string)
- query (string)
- filters (array)
- sorts (array)
#### searchContent tasks:personal or tasks:admin
- Search authorized Markdown documents and collection records without exposing inaccessible matches.
- query (string, required)
#### saveCollectionView tasks:personal or tasks:admin
- Create or update a saved table view with visible fields, filters, and sorts.
- viewId (string)
- expectedVersion (number)
- visibleFieldIds (array)
- isDefault (boolean)
#### createDocument tasks:personal or tasks:organization or tasks:admin
- Create a markdown document (version 1). Private by default. Optionally attach it to a task you can view.
- title (string, required) — Document title
- body (string, required) — Markdown body
- taskId (string) — Optional task to attach the document to
- jurisdictionId (string) — Optional jurisdiction. Defaults to the attached task's jurisdiction.
- organizationId (string) — Optional organization that owns the document
- parentDocumentId (string) — Optional parent document
- idempotencyKey (string, required) — Stable retry key for this create request
- visibility (enum) — PRIVATE (default) or PUBLIC.
#### updateDocument tasks:personal or tasks:organization or tasks:admin
- Update a document. Writes an immutable revision and rejects stale edits. Omitted fields carry forward.
- documentId (string, required) — Stable document ID
- expectedVersion (number, required) — Version returned by getDocument
- body (string) — Full replacement markdown body
- organizationId (any) — Organization owner, or null to remove it
- parentDocumentId (any) — Parent document, or null to move it to the root
- taskId (any) — Linked task, or null to remove the task link
#### getDocument tasks:personal or tasks:organization or tasks:admin
- Read a document or historical revision plus its revision list when you have access.
- documentId (string, required) — Stable document ID or historical revision ID
#### listDocuments tasks:personal or tasks:organization or tasks:admin
- List documents you can see. Filter by taskId to see a task's documents.
- taskId (string) — Only documents on this task
#### getDocumentReview tasks:personal or tasks:organization or tasks:admin
- Read the exact document revision and instructions assigned to the authenticated reviewer.
- reviewTaskId (string, required)
#### createDocumentProposal tasks:personal or tasks:organization or tasks:admin
- Create a separate private proposal document from selected comments on one exact document revision.
- authorityTaskId (string, required)
- baseDocumentRevisionId (string, required)
- body (string, required)
- idempotencyKey (string, required) — Stable retry key for this operation.
- sourceCommentIds (array, required)
- summary (string, required)
- title (string, required)
#### applyDocumentProposal tasks:personal or tasks:organization or tasks:admin
- Apply a pinned proposal artifact to its unchanged base document as a new immutable revision.
- proposalArtifactId (string, required)
#### requestDocumentReview tasks:personal or tasks:organization or tasks:admin
- Create a private assigned review task pinned to one exact immutable document revision.
- documentRevisionId (string, required)
- instructions (string, required)
- reviewerPersonId (string, required)
#### submitDocumentReview tasks:personal or tasks:organization or tasks:admin
- Submit an explained verdict for the exact revision assigned to the authenticated reviewer.
- explanation (string, required)
- verdict (enum, required)
#### decideDocumentRevision tasks:personal or tasks:organization or tasks:admin
- Record an authorized immutable internal ADOPT or REJECT decision on one exact current revision.
- reason (string)
- reviewArtifactId (string, required)
#### manageContentAccess tasks:personal or tasks:admin
- List, grant, or revoke access to a document or collection. Grant and revoke require full access. A user may be identified by Optimitron user ID or account email.
- resourceId (string, required)
- resourceType (enum, required)
- granteeType (enum)
- granteeId (string)
- granteeEmail (string)
- accessLevel (enum)
#### manageContentFiles tasks:personal or tasks:admin
- List files, prepare or complete an upload, obtain a short-lived authorized download URL, or delete a private document/collection-record file.
- attachmentId (string)
- documentId (string)
- collectionRecordId (string)
- checksumSha256 (string)
- contentType (string)
- fileName (string)
- sizeBytes (number)
#### exportContent tasks:personal or tasks:admin
- Export an authorized document snapshot or one cursor-paginated collection page. Private file metadata is included, but storage keys and unsigned object URLs are never returned.
#### reviewPrivateTaskBundle tasks:personal or tasks:organization
- Validate, normalize, deduplicate, and hash a user-selected private conversation-to-work batch without writing tasks. Review every returned error and action before applyPrivateTaskBundle.
- rootTaskId (string, required) — Private personal or organization root/container task ID.
- source (object, required)
- candidates (array, required)
#### applyPrivateTaskBundle tasks:personal or tasks:organization
- Atomically apply a previously reviewed private task bundle as ACTIVE tasks. The server recomputes reviewHash; changed or invalid bundles are rejected. Raw transcript text is not accepted.
- reviewHash (string, required)
#### startTaskExecution tasks:personal or tasks:organization
- Start the canonical execution attempt for an accessible active, unblocked leaf task. Reserved roots, containers, and tasks with active or pending-verification attempts are rejected.
- agentExecutorId (string | null)
- confidence (number | null)
- estimatedCost (object | null)
- estimatedDurationSeconds (number | null)
- runContext (object | null)
#### submitTaskArtifact tasks:personal or tasks:organization
- Submit exactly one immutable artifact for a running execution attempt: a task-linked document revision, content attachment, task-comment attachment, external URL, or structured result.
- contentAttachmentId (string)
- documentRevisionId (string)
- externalUrl (string)
- label (string | null)
- metadata (object | null)
- structuredResult (any)
- taskCommentAttachmentId (string)
- taskExecutionAttemptId (string, required)
#### submitTaskForVerification tasks:personal or tasks:organization
- Finish a running attempt, snapshot the task's acceptance criteria, record actual duration/cost, and create a pending typed verification. At least one artifact is required.
- actualCost (object | null)
- actualDurationSeconds (number, required)
- method (enum)
- outputSummary (string, required)
#### verifyTaskExecution tasks:personal or tasks:organization
- Accept or reject one pending execution verification against its immutable criteria snapshot. Acceptance verifies the task; rejection preserves evidence and requeues it as ACTIVE.
- criterionResults (array, required)
- evidence (object | null)
- result (enum, required)
- taskVerificationId (string, required)
#### getTaskAuditTrail tasks:personal or tasks:organization
- Read the accessible task's provenance, claims, comments, execution attempts, artifact hashes, and verification history without exposing raw private source content.
#### proposeExternalAction tasks:personal or tasks:organization
- Create an immutable outbound message or browser-action request for human approval. This does not approve or execute anything; editing requires a new idempotency key and request.
- destination (string, required)
- expiresAt (string)
- operation (string, required)
- payload (object, required)
- taskExecutionAttemptId (string | null)
#### recordExternalActionResult tasks:personal or tasks:organization
- Record one terminal execution receipt for an already human-approved external action. The exact approved payload cannot be changed or replayed through this tool.
- externalActionRequestId (string, required)
- failureMessage (string | null)
- receipt (object | null)
#### exportPrivateWork tasks:personal or tasks:organization
- Export one private root subtree you manage, including tasks, internal comments, safe attachment metadata, source provenance, execution evidence, linked current documents, and internal dependency edges.
- rootTaskId (string, required)
#### deletePrivateSourceSelection tasks:personal or tasks:organization
- Scrub and unlink one reviewed private source selection you own or administer. Derived tasks remain; approved excerpts, anchors, aliases, URLs, and external identifiers are removed.
- sourceArtifactId (string, required)
#### findReviewedAnswers tasks:personal or tasks:organization
- Find reusable reviewed text answers for one person or organization.
- subject (object, required)
- question (string, required)
- knowledgeKey (string)
- contextTags (array)
- asOf (string)
#### prepareFormResponses tasks:personal or tasks:organization
- Capture a form's narrative fields, prepare reusable responses, and create one shared review task for each unresolved answer.
- formKey (string)
- formTitle (string)
- formSourceUrl (string)
- formPurpose (enum)
- formTaskId (string, required)
- questions (array, required)
#### proposeFormSubmission tasks:personal or tasks:organization
- Propose the exact prepared form submission for human approval without executing it.
- formSubmissionId (string, required)
### EARTHDATA:WRITE (33)
#### castReferendumVote earthdata:write
- Cast or update the authenticated user's own referendum vote.
- answer (enum)
- publicComment (string)
- referendumSlug (string)
#### recordRepresentedReferendumVote earthdata:write
- Record a represented or memorial referendum vote for an existing Person.
- isPublic (boolean)
- personId (string, required)
#### searchPeople earthdata:write
- Search public Person records by name, handle, affiliation, or source key.
- publicOnly (boolean)
#### getPerson earthdata:write
- Fetch one Person by id or handle, including public memorial/vote context.
- idOrHandle (string)
- personId (string)
- publicOnly (boolean) — Admin-only escape hatch. Non-admin callers always receive public data.
#### searchOrganizations earthdata:write
- Search organization records by name, slug, website, or source key.
#### signReferendumAsOrganization earthdata:write
- Sign a referendum as an organization, auto-active under post-moderation.
- newOrganizationName (string)
- type (string)
- website (string)
- donationUrl (string)
- squareLogoUrl (string) — Square logo mark URL. Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.
- wordmarkLogoUrl (string) — Horizontal wordmark logo URL. Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.
- contactEmail (string)
- position (enum)
- statement (string)
#### upsertMemorialPerson earthdata:write
- Create or update a memorial/represented Person, optional condition, memorial, evidence, responsible party, relationship, and YES referendum vote. Agent imports require sourceKey/sourceRef plus sourceUrl or sourceArtifactId.
- PARAMETERS (25)
- displayName (string, required)
- lifeStatus (enum)
- birthDate (string)
- dateOfDeath (string)
- deathCountryCode (string)
- conditionName (string)
- conditionCodeSystem (string)
- conditionCode (string)
- causeCategory (string)
- conflictId (string)
- conflictName (string)
- responsiblePartyName (string)
- relationshipType (string)
- imageUrl (string)
- memorialMessage (string)
- consentCourtEvidence (boolean)
- recordTreatyVote (boolean)
- sourceKind (enum)
- sourceKey (string)
- sourceRef (string)
- sourceUrl (string)
- sourceArtifactId (string)
#### addMemorialEvidence earthdata:write
- Attach public non-sensitive sourced evidence to a memorial. Requires sourceUrl or sourceArtifactId.
- memorialId (string, required)
- evidenceKind (string)
- isPublic (boolean) — Must be true; private evidence is not accepted.
- containsSensitiveData (boolean) — Must be false; do not submit sensitive evidence.
#### addMemorialResponsibleParty earthdata:write
- Attach a government, organization, or free-text responsible party to a memorial.
- PARAMETERS (10)
- roleSlug (string)
- isPrimary (boolean)
- confidenceScore (number)
#### upsertConflict earthdata:write
- Create or update a named conflict reference by slug/name/source key.
- slug (string)
- startDate (string)
- endDate (string)
- primaryJurisdictionId (string)
#### resolveGlobalVariable earthdata:write
- Find or create a canonical condition, intervention, side-effect, outcome, or policy GlobalVariable, with optional external code.
- kind (enum)
- codeSystem (string)
- code (string)
- variableCategoryName (string)
#### upsertSourceArtifact earthdata:write
- Store source/provenance data without executing it. For Python, notebooks, or other calculation code, use artifactType CALCULATION_SOURCE and payloadJson with language and source; Optimitron marks it inert, computes its content hash, and rejects mutation under the same sourceKey.
- sourceKey (string, required)
- sourceSystem (string)
- artifactType (string)
- externalKey (string)
- versionKey (string)
- contentHash (string)
- payloadJson (object) — For calculation code: { language, source, runtime?, dependencies?, entrypoint?, inputs?, outputs?, notes? }. Code is retained as inert data and is never run by this tool or by the web application.
#### upsertCourtCase earthdata:write
- Create or update a Court of Humanity case root record.
- id (string)
- summary (string)
- nominalPlaintiffSubjectId (string)
- primaryRespondentSubjectId (string)
- beneficiarySubjectId (string)
- rootTaskId (string)
- juryReferendumId (string)
- metadataJson (object)
#### addCourtCaseParty earthdata:write
- Attach a plaintiff, respondent, class, beneficiary, or amicus Subject to a Court of Humanity case.
- PARAMETERS (16)
- caseId (string, required)
- partyKey (string)
- subjectId (string)
- subjectExternalId (string)
- subjectDisplayName (string)
- subjectType (string)
- role (enum, required)
- capacity (enum)
- displayNameSnapshot (string)
- standingTheory (string)
- powerToRemedyScore (number)
- blameAttributionScore (number)
- publicAccountabilityScore (number)
- sortOrder (number)
#### addCourtCaseClaim earthdata:write
- Add a structured allegation or requested finding to a Court of Humanity case.
- claimKey (string)
- claimType (string)
- argumentMarkdown (string, required)
- requestedFinding (string)
#### addCourtCaseHarm earthdata:write
- Add a quantified or qualitative harm catalog row to a Court of Humanity case.
- PARAMETERS (18)
- claimId (string)
- harmKey (string)
- harmType (string)
- bodyMarkdown (string)
- affectedSubjectId (string)
- parameterName (string)
- lowValue (number)
- baseValue (number)
- highValue (number)
- unit (string)
#### addCourtCaseEvidence earthdata:write
- Attach public non-sensitive evidence to a Court of Humanity case, claim, or harm.
- PARAMETERS (19)
- harmId (string)
- evidenceKey (string)
- evidenceType (string)
- personMemorialId (string)
- containsSensitiveData (boolean) — Must be false; sensitive evidence is not accepted.
- reviewStatus (enum)
#### addCourtCaseRemedy earthdata:write
- Add a requested remedy that can point at an existing enforcement Task.
- targetPartyId (string)
- remedyKey (string)
- remedyType (string)
- bodyMarkdown (string, required)
- amountUsdLow (number)
- amountUsdBase (number)
- amountUsdHigh (number)
- deadlineAt (string)
- enforcementTaskId (string)
#### getCourtCase earthdata:write
- Fetch a Court of Humanity case with parties, claims, harms, evidence, remedies, and jury referendum.
- caseIdOrSlug (string)
#### openCourtCaseJuryVote earthdata:write
- Open or update the public referendum used as a Court of Humanity jury vote.
- caseIdOrSlug (string, required)
- questionKey (string)
- questionTitle (string)
#### upsertInterventionApprovalTimeline earthdata:write
- Create or update a regulatory first-evidence/approval timeline for an intervention and condition.
- interventionName (string, required)
- conditionName (string, required)
- interventionGlobalVariableId (string)
- conditionGlobalVariableId (string)
- brandName (string)
- regulatorName (string)
- firstEvidenceDate (string)
- approvalDate (string)
#### upsertVariableRelationshipEvidenceEstimate earthdata:write
- Import or update evidence for predictor GlobalVariable -> outcome GlobalVariable effects.
- PARAMETERS (13)
- predictorGlobalVariableId (string, required)
- outcomeGlobalVariableId (string, required)
- contextGlobalVariableId (string)
- metricKind (string)
- sourceType (string)
- value (number)
- participants (number)
- studies (number)
- rationale (string)
#### recordInterventionExperience earthdata:write
- Record a user's intervention experience with optional outcomes and side effects.
- interventionGlobalVariableId (string, required)
- status (string)
- startedAt (string)
- endedAt (string)
- doseValue (number)
- doseUnitId (string)
- frequencyText (string)
- notes (string)
- outcomes (array)
- sideEffects (array)
#### runEfficacyLagMatcher earthdata:write
- Match memorial deaths to approval timelines and create efficacy-lag evidence candidates.
#### reportContent earthdata:write
- Report wrong, duplicate, spam, impersonation, abusive, or unsourced public data for post-moderation review.
- targetType (string, required)
- targetId (string, required)
- reasonType (string, required)
- message (string)
- correctionJson (object)
#### suggestCorrection earthdata:write
- Suggest structured replacement fields for an existing public data record.
- reasonType (string)
- correctionJson (object, required)
#### uploadImageFromUrl earthdata:write or tasks:admin
- Fetch a public image URL, normalize it through the same image pipeline used by the web app, upload it to object storage, and return the canonical public URL. Use this before createOrganization/updateOrganization when you have a remote square logo, wordmark, or person photo URL.
- url (string, required) — Public http(s) image URL. Local/private network hosts are rejected.
- kind (enum, required) — Upload target. Organization logos usually use organization-square-logo and organization-wordmark-logo.
- filename (string) — Optional filename to use before normalization. Defaults to the URL path filename.
#### createOrganization earthdata:write or tasks:admin
- Create an approved organization for task assignment. Uses post-moderation: create now, reject later if needed. Visibility defaults to PRIVATE (visible only to members) unless visibility='PUBLIC' is passed explicitly — only make an organization PUBLIC when it needs to be publicly discoverable or assigned public tasks.
- name (string, required) — Organization name
- type (enum, required) — Organization type
- slug (string) — Optional URL slug. Defaults to a kebab-case slug generated from name.
- website (string) — Website URL
- contactEmail (string) — Primary contact email
- description (string) — Mission or provenance note
- status (enum) — Organization status. Defaults to APPROVED.
- visibility (enum) — Discoverability. PRIVATE organizations are visible only to their members. MCP-created organizations default to PRIVATE — pass visibility='PUBLIC' explicitly to make it publicly discoverable and referenceable by public tasks.
- donationUrl (string) — Direct support or donation page URL
- jurisdictionId (string) — Optional jurisdiction ID
#### updateOrganization earthdata:write or tasks:admin
- Edit an existing Organization. Caller must be an owner/admin of the org. status and jurisdictionId changes additionally require platform-admin privileges.
- organizationId (string, required) — Organization ID to update
- name (string) — New name
- slug (string) — New URL slug. Pass empty string to regenerate from the (possibly updated) name. Slug collisions auto-disambiguate with -2, -3, etc.
- type (enum)
- status (enum) — Approval status. Platform-admin only.
- visibility (enum) — Organization discoverability. Owner/admin members may flip either direction; no extra platform-admin gate. Switching to PRIVATE is rejected if the organization owns or is assigned any PUBLIC task.
- website (string) — Website URL (empty string clears)
- description (string) — Mission or provenance note (empty string clears)
- donationUrl (string) — Direct support or donation page URL (empty string clears)
- squareLogoUrl (string) — Square logo mark URL (empty string clears). Use uploadImageFromUrl with kind=organization-square-logo first when starting from a remote public image URL.
- wordmarkLogoUrl (string) — Horizontal wordmark logo URL (empty string clears). Use uploadImageFromUrl with kind=organization-wordmark-logo first when starting from a remote public image URL.
- contactEmail (string) — Primary contact email (empty string clears)
- jurisdictionId (string) — Jurisdiction ID (empty string clears). Platform-admin only.
#### addOrganizationMember earthdata:write or tasks:admin
- Add a user to an Organization with a given role, or update an existing member's role to that value. Caller must be an owner/admin of the org. Accepts only userId (no email lookup — that would expose User-account enumeration).
- organizationId (string, required) — Organization ID
- userId (string, required) — User ID to add as a member
- role (enum) — Role within the organization. Default: member.
#### removeOrganizationMember earthdata:write or tasks:admin
- Remove a user from an Organization. Caller must be an owner/admin of the org, OR be removing themselves. Cannot remove the last remaining owner — transfer ownership first by adding another owner.
- userId (string, required) — User ID to remove
#### updateOrganizationMemberRole earthdata:write or tasks:admin
- Change a member's role within an Organization. Caller must be an owner/admin. Cannot demote the last remaining owner.
- userId (string, required) — User ID whose role to change
- role (enum, required) — New role.
#### listOrganizationMembers earthdata:write
- List members of an Organization with their roles, emails, and display names. Caller must be an owner/admin of the org.
### ADMIN-ONLY (32)
#### hideContent ADMIN earthdata:admin
- Admin-only: hide or soft-delete a supported public Earth-data record.
#### restoreContent ADMIN earthdata:admin
- Admin-only: restore a hidden supported Earth-data record.
#### resolveContentReport ADMIN earthdata:admin
- Admin-only: mark a content report as resolved or dismissed.
- id (string, required)
- resolutionNote (string)
#### getTaskTreeAudit ADMIN tasks:admin
- Admin-only complete audit of the task graph rooted at Optimize Earth. Pages stable findings—not tasks—so a steward can inspect every structural, duplicate, routing, provenance, estimate, and bounded-agent-work issue without the listTasks result cap. Treat requiresApproval=true findings as proposals only.
- cursor (string) — Stable issue cursor returned by the preceding page. Omit for the first page.
- limit (number) — Findings per page (default 100, maximum 500).
- rootTaskId (string) — Root task ID. Defaults to optimize-earth.
#### findTaskCandidates ADMIN tasks:admin
- Admin-only: score users and active agent executors as possible executors for one task.
- limit (number) — Max candidates, default 20, max 100.
- includeAgents (boolean) — Include active AgentExecutor rows. Default true.
#### saveTaskCandidateMatch ADMIN tasks:admin
- Admin-only: upsert a scored candidate match for a task so later chats/agents can review or assign it.
- candidateKind (enum, required)
- candidateKey (string) — Stable key. If omitted, derived from candidateUserId/personId/organizationId/agentExecutorId.
- candidateUserId (string)
- candidatePersonId (string)
- candidateOrganizationId (string)
- agentExecutorId (string)
- score (number, required)
- scoreVersion (string)
- reasonJson (object | array | null)
- blockersJson (object | array | null)
- estimatedCostMinorUnits (integer | null)
- estimatedCostCurrency (string | null)
- estimatedDurationSeconds (integer | null)
#### updateTaskCandidateMatchStatus ADMIN tasks:admin
- Admin-only: update a saved task candidate match status.
- matchId (string, required)
- status (enum, required)
#### listAgentExecutors ADMIN agent:run or tasks:admin
- Admin-only: list non-human executors addressable by task routing.
- provider (string)
- capabilityTags (array)
#### upsertAgentExecutor ADMIN agent:run or tasks:admin
- Admin-only: create or update a non-human task executor.
- agentKey (string, required)
- provider (string | null)
- modelName (string | null)
- averageCostUsd (number | null)
- averageLatencySeconds (number | null)
- successRate (number | null)
- metadata (object | array | null)
#### setAgentExecutorStatus ADMIN agent:run or tasks:admin
- Admin-only: set an AgentExecutor status.
#### listTaskEmails ADMIN tasks:admin
- Admin-only: list task email communications and linked email logs for one task.
- email (string) — Optional recipient email filter.
- q (string) — Optional search across subject, recipient, task title, and provider email address.
#### listRecipientEmails ADMIN tasks:admin
- Admin-only: list task email communications and email logs sent to a user, person, organization, or raw email address.
- email (string) — Recipient email address.
- organizationId (string) — Recipient organization ID.
- personId (string) — Recipient person ID.
- userId (string) — Recipient user ID.
#### listEmailLogs ADMIN tasks:admin
- Admin-only: list provider-level email logs, optionally filtered by task, recipient email, user, person, organization, or search text.
- organizationId (string) — Recipient organization ID through task communications.
- personId (string) — Recipient person ID through task communications.
- q (string) — Optional search across subject, recipient, task title, template, and provider message id.
- taskId (string) — Linked task ID.
#### createPerson ADMIN tasks:admin
- Create or idempotently update a person profile by displayName, email, sourceRef, or public-figure signature.
- displayName (string, required) — Person display name.
- email (string) — Person email (used for de-dup and notification).
- currentAffiliation (string) — Current organization/affiliation.
- countryCode (string) — ISO-3166 country code.
- image (string) — Avatar image URL. Use uploadImageFromUrl with kind=person-photo first when starting from a remote public image URL.
- isPublicFigure (boolean) — Marks this person as a public-facing profile.
- sourceRef (string) — Stable source key for idempotent updates.
- sourceUrl (string) — Source URL for provenance.
#### mergeTask ADMIN tasks:admin
- Admin-only: fold a duplicate task into a canonical task. Re-points every live relation (children, claims, applications, comments, edges, communications, funding, documents, etc.) to the canonical task, records merge provenance in both tasks' contextJson, then soft-deletes the duplicate. Refuses a duplicate that carries a taskKey (managed or trigger-owned tasks) — pick the keyed task as the canonical instead. Unique-constraint collisions are skipped and left on the duplicate; the canonical task's status, completion, and actuals are never changed. Effectively irreversible — review both tasks first. Returns per-relation moved/skipped counts.
- duplicateTaskId (string, required) — Task ID to fold into the canonical task and soft-delete
- canonicalTaskId (string, required) — Task ID that survives and receives the duplicate's relations
#### upsertOrganization ADMIN earthdata:admin or tasks:admin
- Create or update a general Organization record for task assignment. This is not outreach-specific; use it for nonprofits, governments, companies, universities, and other assignees.
- type (enum) — Organization type
- contactEmail (string) — General contact email
- sourceRef (string) — Stable source reference for idempotent imports
- sourceUrl (string) — Source URL proving this organization/contact
#### deleteOrganization ADMIN earthdata:admin or tasks:admin
- Soft-delete an Organization (sets deletedAt). Caller must be an owner of the org AND a platform admin. Tasks previously assigned to this org keep their assigneeOrganizationId — orphan visibility is intentional for accountability.
- organizationId (string, required) — Organization ID to soft-delete
#### setTaskImpact ADMIN tasks:admin
- Create or replace a task impact estimate. Values are USD-equivalent welfare; expectedEconomicValueUsd* fields must already be probability-weighted. Include low/base/high ranges, assumptions, and sourceUrls for subjective or high-value estimates. Negative values represent harm caused.
- taskId (string, required) — Task ID to attach impact to
- frameKey (enum) — Time horizon for evaluation (default: FIVE_YEAR)
- frame (object) — Low/base/high impact frame. expectedEconomicValueUsd* is already probability-weighted; for Notion imports use P(success) * Value.
- metrics (array) — Custom impact metrics (lives lost, taxpayer cost, suffering hours, etc.)
- assumptions (array) — Human-readable assumptions, including probability gates and why subjective values are plausible
- sourceUrls (array) — Sources/citations for the value, probability, deadline, or conversion assumptions
- estimateNotes (string) — Short explanation of the calculation and what would change the estimate
- formulaText (string) — The arithmetic behind the number, in plain text, so a reader can check it without running anything
- formulaLatex (string) — Same formula as LaTeX, rendered on the task page
- calculationVersion (string) — Version tag for the calculation method
#### logAgentRun ADMIN agent:run
- Log an agent's work — what it did, what it cost, what task it advanced.
- runId (string, required) — Unique run identifier
- provider (string, required) — AI provider (gemini, anthropic, openai)
- costUsd (number, required) — Total cost in USD
- apiCalls (number, required) — Number of API calls
- taskId (string, required) — Task this run worked on
- agentId (string) — Stable agent identifier, usually matching the lease agentId
- outputSummary (string) — What the run produced
#### acquireLease ADMIN agent:run
- Acquire a short-lived lease on a task to prevent other agents from working it simultaneously.
- taskId (string, required) — Task ID to lease
- agentId (string, required) — Unique agent identifier
- leaseSeconds (number) — Lease duration in seconds (default 600)
#### heartbeatLease ADMIN agent:run
- Extend an active lease. Call periodically to prevent expiry while working.
- agentId (string, required) — Agent identifier
- leaseSeconds (number) — New lease duration in seconds (default 600)
#### releaseLease ADMIN agent:run
- Voluntarily release a lease so another agent can pick up the task.
#### createReferendum ADMIN tasks:admin
- Create a new referendum row. Defaults to DRAFT so a new question does not start accepting votes until intentionally activated.
- title (string, required) — Human-readable referendum title.
- slug (string) — Optional URL slug. Defaults to a slugified title.
- description (string) — Short public summary for cards, lists, and metadata.
- question (string, required) — Canonical yes/no ballot question voters answer.
- bodyMarkdown (string) — Full public referendum detail text in Markdown.
- kind (enum) — Referendum kind. Defaults to GENERAL.
- status (enum) — Initial status. Defaults to DRAFT.
- jurisdictionId (string) — Optional jurisdiction ID if this referendum is scoped.
#### searchRepo ADMIN github
- Search allowed GitHub repositories through the server-side GitHub API token. Returns matching files and text-match snippets without exposing the token.
- query (string, required) — Search string, e.g. a function name, symbol, or code fragment.
- repo (string) — Repository name or owner/repo. Default: the configured Optimitron repo.
- path (string) — Optional directory path qualifier, e.g. apps/optimitron/src/lib.
- fileType (string) — Optional file extension without a dot, e.g. ts or tsx.
- limit (number) — Max GitHub code-search results to return (default 10, max 25).
#### getFileContent ADMIN github
- Fetch one allowed GitHub repository file through the server-side GitHub Contents API.
- repo (string, required) — Repository name or owner/repo.
- path (string, required) — File path within the repo.
- ref (string) — Optional branch, tag, or commit SHA. Default: main.
#### listRepoFiles ADMIN github
- List files/directories from an allowed GitHub repository directory through the server-side GitHub Contents API.
- path (string) — Directory path within the repo. Default: repo root.
#### githubApi ADMIN github
- Admin-only generic pass-through to api.github.com using the server-side token. Use this for issues, PRs, discussions, commit statuses, workflow runs, agent tasks, etc. — anything the dedicated tools don't already cover. Repo-allowlist is enforced on /repos/<owner>/<repo>/* paths; non-repo paths (/user, /search/code, /octocat) rely on the token's fine-grained scopes for safety. Returns { status, ok, body }.
- method (enum) — HTTP method. Default: GET.
- path (string, required) — Path on api.github.com starting with '/', e.g. '/repos/mikepsinn/optimitron/issues' or '/search/code'.
- query (object) — Optional query-string params, e.g. { per_page: 50, state: 'open' }.
- body (any) — Optional request body for non-GET requests. Pass an object (auto-JSON.stringify'd) or a raw string.
#### createTaskTemplate ADMIN tasks:admin
- Create a reusable task template backed by TaskTrigger. Use this when a task should be stamped out for many people/orgs or fired by an event such as user.signup. Defaults to eventName='manual' and disabled until previewed/enabled.
- templateKey (string, required) — Stable unique key for this template, e.g. mission:first-hour.
- eventName (string) — Event that fires this template. Defaults to manual. Use user.signup for everyone-on-signup tasks.
- idempotencyKeyTemplate (string) — Template producing one stable task-key base per target. Defaults to '<templateKey>:{{target.kind}}:{{target.id}}', or '<templateKey>:user:{{user.id}}' for user.* events.
- eventFilter (object)
- completionGate (object)
- enabled (boolean) — Defaults to false. Preview first, then enable when the template is right.
- spawnSpecs (array, required) — One spawned task per spec. Use assigneePersonResolver='context.target.id' for person targets, assigneeOrganizationResolver='context.target.id' for organization targets, or resolver='actor' for the calling user.
- metadata (object)
#### assignTaskTemplate ADMIN tasks:admin
- Stamp out a task template for one target. Writes are idempotent through the template's idempotencyKeyTemplate and the spawned taskKey values.
#### createTaskTrigger ADMIN tasks:admin
- Create a new TaskTrigger blueprint. The trigger fires on a named event (e.g. 'user.signup', 'referral.sent', 'cron.<name>') and either spawns tasks, verifies a task on a completion gate, or spawns a communication. Templates use {{path.to.field}} substitution against the event context. This is the data-driven way to add new onboarding flows / reminder cadences / task spawners without a code commit. Returns the created trigger row.
- triggerKey (string, required) — Stable unique key, e.g. 'user-onboarding:treaty'.
- eventName (string, required) — Event that fires this trigger.
- triggerKind (enum) — What the trigger does. Defaults to spawnTasks.
- idempotencyKeyTemplate (string, required) — Template producing a unique key per logical fire, e.g. 'user-onboarding:treaty:{{user.id}}'.
- eventFilter (object) — Optional JSON filter (equals/matches/and/or/not/exists).
- completionGate (object) — Optional gate spec (allOf/anyOf/count/always). Add inputScope: 'siblings' to gate against the verify target's siblings instead of its children.
- jurisdictionId (string) — Optional jurisdiction scope.
- notes (string) — Free-form notes.
- enabled (boolean) — Defaults to false for MCP-authored triggers.
- schedule (string) — Optional cron expression (e.g. '30 * * * *'). When set, /api/cron/run-due-triggers fires this trigger when the schedule is due since its last successful fire. Omit for triggers that fire only on application events (user.signup, referral.sent, etc.).
- iterationSource (enum) — Optional resolver key for the data the cron handler iterates over before firing. 'overdue-tasks' fires the trigger once per overdue Task; 'none' fires once with no record. Omit for non-cron triggers.
- spawnSpecs (array) — For triggerKind=spawnTasks: one spec per task to create. At most one isParent=true. Children get taskKey '<idempotencyKey>:<kind>'; parent gets just '<idempotencyKey>'.
- communicationSpawnSpecs (array) — For triggerKind=spawnCommunication: one spec per outbound message.
#### updateTaskTrigger ADMIN tasks:admin
- Update an existing TaskTrigger by triggerKey. Pass only the fields you want to change. spawnSpecs / communicationSpawnSpecs, when supplied, REPLACE the existing specs (delete + recreate).
- triggerKind (enum)
- idempotencyKeyTemplate (string)
- schedule (string) — Cron expression. See createTaskTrigger.
- iterationSource (enum) — Resolver key. See createTaskTrigger.
- spawnSpecs (array)
- communicationSpawnSpecs (array) — Replaces existing communication specs. Each item supports the same fields as in createTaskTrigger, including minSendCount / maxSendCount for escalating-tone variants.
#### disableTaskTrigger ADMIN tasks:admin
- Soft-disable a TaskTrigger. Sets enabled=false with an optional reason. Re-enable by calling updateTaskTrigger with enabled:true.
- disabledReason (string)
