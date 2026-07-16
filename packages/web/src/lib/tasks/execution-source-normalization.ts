import { createHash } from "node:crypto";

export interface NotionPlanningItem {
  acceptanceCriteria?: string[];
  actionContext?: string | null;
  dependencySourceIds?: string[];
  estimatedEffortHours?: number | null;
  id: string;
  parentSourceId?: string | null;
  title: string;
  url: string;
}

export interface ExistingPlanningSource {
  sourceHash: string | null;
  sourceKey: string;
  taskId: string;
}

export interface CalendarPlanningEvent {
  endAt: Date | string;
  id: string;
  isRoutine?: boolean;
  kind?: "commitment" | "routine" | "task";
  recurringSeriesId?: string | null;
  startAt: Date | string;
  title: string;
  url?: string | null;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sourceClockTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function calendarEventDurationHours(event: CalendarPlanningEvent) {
  const durationMilliseconds =
    new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
  const boundedDurationMilliseconds =
    Number.isFinite(durationMilliseconds) && durationMilliseconds > 0
      ? Math.max(60_000, durationMilliseconds)
      : 60_000;
  return boundedDurationMilliseconds / 3_600_000;
}

export function normalizePlanningTitle(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b(the|a|an|my|our)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function notionTaskKey(sourceKey: string) {
  return `planner-source:${sourceHash(sourceKey).slice(0, 32)}`;
}

export function normalizeNotionPlanningItems(input: {
  existingSources?: ExistingPlanningSource[];
  items: NotionPlanningItem[];
}) {
  const existingBySourceKey = new Map(
    (input.existingSources ?? []).map((source) => [source.sourceKey, source]),
  );
  const proposals: Array<Record<string, unknown>> = [];
  const unchanged: Array<{ sourceKey: string; taskId: string }> = [];
  const changed: Array<{ sourceKey: string; taskId: string }> = [];

  for (const item of input.items) {
    const stableSourceKey = `notion:${item.id}`;
    const hash = sourceHash({
      acceptanceCriteria: item.acceptanceCriteria ?? [],
      actionContext: item.actionContext ?? null,
      dependencySourceIds: item.dependencySourceIds ?? [],
      estimatedEffortHours: item.estimatedEffortHours ?? null,
      parentSourceId: item.parentSourceId ?? null,
      title: normalizeWhitespace(item.title),
    });
    const existing = existingBySourceKey.get(stableSourceKey);
    if (existing?.sourceHash === hash) {
      unchanged.push({ sourceKey: stableSourceKey, taskId: existing.taskId });
      continue;
    }
    if (existing) {
      changed.push({ sourceKey: stableSourceKey, taskId: existing.taskId });
      continue;
    }

    proposals.push({
      acceptanceCriteria: item.acceptanceCriteria ?? [],
      blockerRefs: (item.dependencySourceIds ?? []).map((id) =>
        notionTaskKey(`notion:${id}`),
      ),
      description:
        item.actionContext ??
        "Review this imported planning item and define its acceptance criteria.",
      estimatedEffortHours: item.estimatedEffortHours ?? null,
      parentTaskRef: item.parentSourceId
        ? notionTaskKey(`notion:${item.parentSourceId}`)
        : null,
      source: {
        sourceHash: hash,
        sourceKey: stableSourceKey,
        sourceSystem: "notion",
        sourceUrl: item.url,
        title: item.title,
      },
      sourceUrls: [item.url],
      taskKey: notionTaskKey(stableSourceKey),
      title: normalizeWhitespace(item.title),
    });
  }

  return {
    changed,
    detectedPilotItems: findPilotConceptGroups(input.items),
    proposals,
    unchanged,
  };
}

export type PilotConcept =
  | "eos-pitch"
  | "medication-routine"
  | "mercury-account";

function pilotConcept(title: string): PilotConcept | null {
  const normalized = normalizePlanningTitle(title);
  if (
    /\b(med|meds|medication|medications|supplement|supplements)\b/.test(
      normalized,
    )
  ) {
    return "medication-routine";
  }
  const referencesEos =
    normalized.includes("earth optimization services") ||
    /\beos\b/.test(normalized);
  if (
    normalized.includes("account") &&
    (normalized.includes("mercury") ||
      (referencesEos && normalized.includes("bank")))
  ) {
    return "mercury-account";
  }
  if (
    (referencesEos && /\b(pitch|deck)\b/.test(normalized)) ||
    /\b(investor pitch|investor one pager|investor presentation|pitch deck)\b/.test(
      normalized,
    )
  ) {
    return "eos-pitch";
  }
  return null;
}

function pilotGroupingKey(title: string) {
  const concept = pilotConcept(title);
  if (concept !== "medication-routine") return concept;
  const normalized = normalizePlanningTitle(title);
  if (/\b(morning|am)\b/.test(normalized)) {
    return `${concept}:morning`;
  }
  if (/\b(evening|night|nighttime|bedtime|pm)\b/.test(normalized)) {
    return `${concept}:night`;
  }
  if (/\b(afternoon|midday|noon)\b/.test(normalized)) {
    return `${concept}:afternoon`;
  }
  return `${concept}:unspecified`;
}

export function findPilotConceptGroups(
  items: Array<{ id: string; title: string }>,
) {
  const groups = new Map<PilotConcept, Array<{ id: string; title: string }>>();
  for (const item of items) {
    const concept = pilotConcept(item.title);
    if (!concept) continue;
    const group = groups.get(concept) ?? [];
    group.push(item);
    groups.set(concept, group);
  }
  return Array.from(groups.entries())
    .map(([concept, group]) => ({ concept, items: group }))
    .sort((left, right) => left.concept.localeCompare(right.concept));
}

export function findPilotDuplicateGroups(
  items: Array<{ id: string; title: string }>,
) {
  const groups = new Map<
    string,
    { concept: PilotConcept; items: Array<{ id: string; title: string }> }
  >();
  for (const item of items) {
    const concept = pilotConcept(item.title);
    const key = pilotGroupingKey(item.title);
    if (!concept || !key) continue;
    const group = groups.get(key) ?? { concept, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return Array.from(groups.values())
    .filter((group) => group.items.length > 1)
    .sort((left, right) => left.concept.localeCompare(right.concept));
}

export function normalizeCalendarForPlanning(events: CalendarPlanningEvent[]) {
  const isRoutine = (event: CalendarPlanningEvent) =>
    event.kind === "routine" || event.isRoutine === true;
  const fixedCommitments = events
    .filter((event) => !isRoutine(event) && event.kind !== "task")
    .map((event) => ({
      endAt: event.endAt,
      sourceEventId: event.id,
      startAt: event.startAt,
      title: event.title,
    }));
  const routineGroups = new Map<string, CalendarPlanningEvent[]>();
  for (const event of events.filter(isRoutine)) {
    const key =
      pilotGroupingKey(event.title) ?? normalizePlanningTitle(event.title);
    const group = routineGroups.get(key) ?? [];
    group.push(event);
    routineGroups.set(key, group);
  }
  const routineProposals = Array.from(routineGroups.entries()).map(
    ([concept, occurrences]) => {
      const first = occurrences[0]!;
      const stableSourceKey = `calendar-routine:${concept}`;
      const sourceSeries = Array.from(
        new Map(
          occurrences.map((event) => {
            const seriesKey = event.recurringSeriesId ?? event.id;
            const start = new Date(event.startAt);
            const end = new Date(event.endAt);
            return [
              seriesKey,
              {
                durationMinutes: Math.max(
                  0,
                  Math.round((end.getTime() - start.getTime()) / 60_000),
                ),
                recurringSeriesId: event.recurringSeriesId ?? null,
                startTime: sourceClockTime(event.startAt),
                title: normalizeWhitespace(event.title),
              },
            ] as const;
          }),
        ).values(),
      ).sort((left, right) =>
        `${left.recurringSeriesId}:${left.title}`.localeCompare(
          `${right.recurringSeriesId}:${right.title}`,
        ),
      );
      return {
        acceptanceCriteria: [
          "Complete the routine once when its trigger is due.",
        ],
        description:
          "Create one recurring Optimitron task template for this routine; do not import each calendar occurrence.",
        estimatedEffortHours: calendarEventDurationHours(first),
        source: {
          sourceHash: sourceHash(sourceSeries),
          sourceKey: stableSourceKey,
          sourceSystem: "google-calendar",
          sourceUrl: first.url ?? null,
          title: first.title,
        },
        taskKey: notionTaskKey(stableSourceKey),
        title: normalizeWhitespace(first.title),
        trigger: {
          kind: "recurring-template",
          sourceSeriesIds: Array.from(
            new Set(
              sourceSeries
                .map((series) => series.recurringSeriesId)
                .filter((id): id is string => Boolean(id)),
            ),
          ).sort(),
        },
      };
    },
  );
  const taskProposals = events
    .filter((event) => event.kind === "task")
    .map((event) => {
      const stableSourceKey = `calendar-task:${event.id}`;
      return {
        acceptanceCriteria: ["Complete the scheduled action once."],
        description:
          "Migrate this one-off action from Calendar into Optimitron so Calendar remains a scheduling constraint rather than a second task database.",
        estimatedEffortHours: calendarEventDurationHours(event),
        source: {
          sourceHash: sourceHash({
            endAt: new Date(event.endAt).toISOString(),
            startAt: new Date(event.startAt).toISOString(),
            title: event.title,
          }),
          sourceKey: stableSourceKey,
          sourceSystem: "google-calendar",
          sourceUrl: event.url ?? null,
          title: event.title,
        },
        taskKey: notionTaskKey(stableSourceKey),
        title: normalizeWhitespace(event.title),
      };
    });

  return {
    detectedPilotItems: findPilotConceptGroups(events),
    duplicateGroups: findPilotDuplicateGroups(events),
    fixedCommitments,
    routineProposals,
    taskProposals,
  };
}
