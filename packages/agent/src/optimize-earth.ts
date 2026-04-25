export interface OptimizeEarthPromptOptions {
  capabilities?: string[];
  maxParallelTasks?: number | null;
  taskSourceLabel?: string | null;
}

const DEFAULT_TASK_SOURCE_LABEL = 'the task database via MCP';

export const OPTIMIZE_EARTH_PROTOCOL_STEPS = [
  'Check the current branch or PR for broken GitHub Actions if that information is available.',
  'If GitHub Actions are broken because of repo code, treat fixing them as the immediate system-blocker task before trusting the queue.',
  'Audit whether the current queue is sane before trusting the top-ranked task.',
  'If the queue is clearly broken and the repo provides bootstrap:optimize-earth, run it once before trusting the frontier.',
  'Call getQueueAudit, then call getNextAction with your capabilities.',
  'If an action returns a task, call acquireLease before doing any work.',
  'Work only on the leased task and touch only files required for that task.',
  'If the task runs longer than the lease TTL, call heartbeatLease.',
  'If the queue is obviously narrow, unsourced, or missing system/growth tasks, propose system-improvement tasks before trusting the frontier.',
  'If no executable task exists, propose only high-value missing tasks or unblockers via proposeTaskBundle.',
  'Do not create ACTIVE tasks directly; agent-created tasks must start as DRAFT.',
  'Use evaluateTaskEconomics before assuming a paid task should be executed directly.',
  'For non-claim execution paths, use recordTaskActuals to store real cash and effort after the work happens.',
  'Respect checkTaskCommunicationCooldown and recordTaskCommunication before outreach.',
  'Log the run with logAgentRun and release the lease when done.',
] as const;

export function buildOptimizeEarthInstruction(input: OptimizeEarthPromptOptions = {}) {
  const capabilities = (input.capabilities ?? []).map((value) => value.trim()).filter(Boolean);
  const taskSourceLabel = input.taskSourceLabel?.trim() ?? DEFAULT_TASK_SOURCE_LABEL;
  const maxParallelTasks = input.maxParallelTasks ?? 1;
  const capabilityLine =
    capabilities.length === 0
      ? 'Use your actual capabilities when calling getNextAction.'
      : `Advertise these capabilities when calling getNextAction: ${capabilities.join(', ')}.`;

  return [
    `Optimize earth using ${taskSourceLabel} as the source of truth.`,
    'First, check the current branch or PR for broken GitHub Actions if that information is available; if repo code is breaking CI, fix that before trusting the queue.',
    'First, check whether the current queue is sane; if it is obviously stupid, improve the queue before trusting its top task.',
    'If the repo exposes pnpm --filter @optimitron/web run bootstrap:optimize-earth and the queue is clearly broken, run that once before calling getNextAction.',
    'Before editing code or creating tasks, call getQueueAudit and then fetch the highest-value next action with getNextAction.',
    capabilityLine,
    `Hold at most ${maxParallelTasks} active lease${maxParallelTasks === 1 ? '' : 's'} at a time.`,
    'If the action requires procurement or fundraising, emit the plan instead of pretending the task was executed.',
    'If no executable task exists, propose only high-value unblockers or missing subtasks via proposeTaskBundle.',
    'Do not create ACTIVE tasks directly. Do not promote tasks unless review passes.',
    'Respect task communication cooldowns, log your run, and release the lease when done.',
  ].join(' ');
}
