import { z } from "zod";

// ---------------------------------------------------------------------------
// task.contextJson Zod schema — the single contract between the seeder and UI
// ---------------------------------------------------------------------------
//
// Every block on /tasks/[id] reads exactly one slot below. If a slot is absent
// the block silently no-ops. Slots map 1:1 to the blocks in docs/mockup.md.

const BrutalToneEnum = z.enum(["red", "green", "cyan", "pink", "yellow"]);

const ContactChannelSchema = z.object({
  kind: z.enum(["twitter", "bluesky", "email", "form", "phone"]),
  label: z.string(),
  href: z.string(),
});

const AssigneeProfileSchema = z.object({
  role: z.string().optional(),
  employerLabel: z.string().optional(),
  employerCount: z.number().optional(),
  employerCountLabel: z.string().optional(),
  salaryUsdPerYear: z.number().optional(),
  budgetUsdPerYear: z.number().optional(),
  jobQuote: z
    .object({ text: z.string(), source: z.string() })
    .optional(),
  contactChannels: z.array(ContactChannelSchema).optional(),
});

const DifficultySchema = z.object({
  whatItMeans: z.string().optional(),
  label: z.string().optional(),
  timeRequiredSeconds: z.number().optional(),
  skillsRequired: z.string().optional(),
});

const UnlockBeforeAfterSchema = z.object({
  label: z.string(),
  before: z.string(),
  after: z.string(),
});

const UnlockSchema = z.object({
  kind: z.enum(["child-task", "inline"]),
  childTaskId: z.string().optional(),
  icon: z.string().optional(),
  title: z.string(),
  summary: z.string().optional(),
  beforeAfter: z.array(UnlockBeforeAfterSchema).optional(),
  roiRatio: z.number().optional(),
  fullAnalysisUrl: z.string().optional(),
});

const ComparisonBarSchema = z.object({
  label: z.string(),
  valueUsd: z.number(),
  color: BrutalToneEnum,
});

const PerCitizenRowSchema = z.object({
  label: z.string(),
  valueUsd: z.number(),
});

const PerformanceReviewSchema = z.object({
  comparisonBars: z.array(ComparisonBarSchema).optional(),
  ratio: z
    .object({
      left: z.number(),
      right: z.number(),
      label: z.string(),
    })
    .optional(),
  perCitizen: z.array(PerCitizenRowSchema).optional(),
  narrative: z.string().optional(),
  rating: z.string().optional(),
  firedFromWendys: z.boolean().optional(),
  scorecardUrl: z.string().optional(),
});

const ReminderSchema = z.object({
  intro: z.string().optional(),
  messageTemplate: z.string(),
});

const ContextComparisonItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  highlight: z.boolean().optional(),
});

const ContextComparisonSchema = z.object({
  heading: z.string(),
  items: z.array(ContextComparisonItemSchema),
});

const BlockedBySchema = z.object({
  taskId: z.string(),
  summary: z.string().optional(),
  callToActionHref: z.string().optional(),
});

const CurrentActivitySchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  impactSummary: z.string().optional(),
  methodology: z.string().optional(),
  sourceUrl: z.string().optional(),
  updated: z.string().optional(),
});

export const TaskContextJsonSchema = z
  .object({
    assigneeProfile: AssigneeProfileSchema.optional(),
    difficulty: DifficultySchema.optional(),
    costOfDelayNote: z.string().optional(),
    unlocks: z.array(UnlockSchema).optional(),
    performanceReview: PerformanceReviewSchema.optional(),
    reminder: ReminderSchema.optional(),
    contextComparisons: z.array(ContextComparisonSchema).optional(),
    blockedBy: BlockedBySchema.optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    currentActivities: z.array(CurrentActivitySchema).optional(),
  })
  .passthrough();

export type TaskContext = z.infer<typeof TaskContextJsonSchema>;
export type TaskContextAssigneeProfile = z.infer<typeof AssigneeProfileSchema>;
export type TaskContextDifficulty = z.infer<typeof DifficultySchema>;
export type TaskContextUnlock = z.infer<typeof UnlockSchema>;
export type TaskContextPerformanceReview = z.infer<typeof PerformanceReviewSchema>;
export type TaskContextReminder = z.infer<typeof ReminderSchema>;
export type TaskContextComparison = z.infer<typeof ContextComparisonSchema>;
export type TaskContextBlockedBy = z.infer<typeof BlockedBySchema>;
export type TaskContextCurrentActivity = z.infer<typeof CurrentActivitySchema>;
export type TaskContextContactChannel = z.infer<typeof ContactChannelSchema>;

const EMPTY_CONTEXT: TaskContext = {};

export function readTaskContext(contextJson: unknown): TaskContext {
  if (!contextJson || typeof contextJson !== "object") {
    return EMPTY_CONTEXT;
  }
  const parsed = TaskContextJsonSchema.safeParse(contextJson);
  return parsed.success ? parsed.data : EMPTY_CONTEXT;
}

// ---------------------------------------------------------------------------
// Legacy reader kept for back-compat with existing call sites until they
// migrate to readTaskContext(). Returns generic-safe data only.
// ---------------------------------------------------------------------------

export interface TaskAcceptanceCriteriaContext {
  acceptanceCriteria: string[];
  currentActivities: Array<{
    description: string;
    id: string | null;
    impactSummary: string | null;
    methodology: string | null;
    sourceUrl: string | null;
    updated: string | null;
  }>;
}

export function readTaskContextSections(
  contextJson: unknown,
): TaskAcceptanceCriteriaContext {
  const ctx = readTaskContext(contextJson);
  return {
    acceptanceCriteria: ctx.acceptanceCriteria ?? [],
    currentActivities: (ctx.currentActivities ?? []).map((activity) => ({
      description: activity.description,
      id: activity.id ?? null,
      impactSummary: activity.impactSummary ?? null,
      methodology: activity.methodology ?? null,
      sourceUrl: activity.sourceUrl ?? null,
      updated: activity.updated ?? null,
    })),
  };
}
