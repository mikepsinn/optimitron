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

CREATING WORK: always searchTasks first (visibility defaults to 'all' — public plus your private work — when signed in; pass 'public' or 'private' to narrow). createTask requires an explicit parentTaskId — choose the closest existing objective; never attach directly to Optimize Earth. Estimate value/p_success/hours honestly; a calibrated guess beats omission. Use proposeTaskBundle for multi-task drafts (it runs duplicate review).

COORDINATING: postTaskComment for threaded discussion (markdown, math, mermaid); claimTask → completeTaskClaim for execution with evidence; updateTask to fix estimates, parents, or dependencies as scope changes.

EXAMPLE ASKS: "I can write TypeScript for two hours — what should I do next?" · "Audit my queue and fix what's wrong." · "Create tasks for this project under the right parent." · "What is the highest-EV thing humanity should do today?"`;
