/**
 * Server instructions sent to MCP clients on initialize. Clients like Claude
 * surface this text to the model when the connector loads, so this is the
 * first (often only) usage guidance an agent sees. Keep it dense and
 * imperative; tool descriptions carry the details.
 */
export const MCP_SERVER_INSTRUCTIONS = `Optimitron is the live task graph for optimizing Earth and the humans on it: one tree rooted at "Optimize Earth", where every task carries expected-value estimates (value, p_success, hours) and the queue ranks work by expected net value per hour with deadline overrides.

START HERE (in order):
1. getMe — your identity, granted scopes, and personal/organization planning roots (created on first call).
2. getQueueAudit — data-health check of the personal queue; repair high-severity issues before trusting rankings.
3. getNextAction or getMyQueue — the user's own ranked next actions. getAIQueue — tasks marked for autonomous agent execution. getNextTask — best public task for an anonymous agent.

CREATING WORK: always searchTasks first (visibility defaults to 'all' — public plus your private work — when signed in; pass 'public' or 'private' to narrow). createTask requires an explicit parentTaskId or exact parentTaskKey — choose the closest existing objective; never attach directly to Optimize Earth. Estimate value/p_success/hours honestly; a calibrated guess beats omission. Use proposeTaskBundle for multi-task drafts (it runs duplicate review).

OPTIMITRON DEVELOPMENT: for an improvement to Optimitron itself, searchTasks with query "optimitron:dev" and visibility "all". Confirm the exact taskKey "optimitron:dev", search again for duplicate work, then call createTask with parentTaskKey='optimitron:dev'. If the development root is not accessible, stop instead of attaching the task somewhere else.

COMPLETING WORK: for a private uncompensated Self task you own, call completeTask once with factual completion evidence; it self-verifies the task and removes it from your active queue. For delegated, shared, paid, public, organization, or agent work, use startTaskExecution → submitTaskArtifact → submitTaskForVerification, then wait for authorized verification. completeTaskClaim only submits one claim for review and never completes the task itself.

COORDINATING: postTaskComment for threaded discussion (markdown, math, mermaid); use claimTask to reserve open work before starting; updateTask to fix estimates, parents, or dependencies as scope changes.

CLIENT RECOVERY: if the MCP host says a tool "has not been loaded yet," retry the exact same call once. That message comes from the host's lazy tool catalog, not Optimitron's argument validation; do not rewrite correct parameters in response.

FORMS: applications, surveys, RFPs, intake forms, and questionnaires use one private task owned by the person or organization answering. These tools cover reusable text and narrative answers; handle signatures, file uploads, and one-time typed controls separately. Read the exact form, then call findReviewedAnswers for each question; include a stable knowledgeKey when the same fact or narrative may be worded differently elsewhere. Call prepareFormResponses with approved revision IDs where available. It reuses only an exact knowledge key or exact normalized prompt, and creates atomic verification tasks for unresolved answers. Context tags improve search but do not split one stable answer into duplicates. Drafts are not approved answers. For each unresolved task, create or use its answer document, run startTaskExecution → submitTaskArtifact → submitTaskForVerification, and wait for acceptance through verifyTaskExecution. Once every response pins an accepted immutable revision, run startTaskExecution for the form task and pass that attempt ID to proposeFormSubmission. It blocks placeholders and returns one exact pending payload. Never submit, publish, spend, or send from that proposal until the human approves the ExternalActionRequest. After execution, record the receipt with recordExternalActionResult. Do not invent facts, silently rewrite an approved answer, or duplicate an authorized current answer.

EXAMPLE ASKS: "I can write TypeScript for two hours — what should I do next?" · "Audit my queue and fix what's wrong." · "Create tasks for this project under the right parent." · "What is the highest-EV thing humanity should do today?"`;
