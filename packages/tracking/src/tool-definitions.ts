// MCP tool definitions for the personal tracking surface. Extracted verbatim
// from apps/optimitron/src/lib/mcp-server.ts; served by optimitron.com and dfda.earth.
import { McpScope } from "@optimitron/db/enums";

import {
  DEFAULT_MEASUREMENT_PAGE_SIZE,
  MAX_MEASUREMENT_PAGE_SIZE,
} from "./core";

export const RECORD_MEASUREMENT_TOOL_NAME = "recordMeasurement" as const;
export const UPDATE_MEASUREMENT_TOOL_NAME = "updateMeasurement" as const;
export const DELETE_MEASUREMENT_TOOL_NAME = "deleteMeasurement" as const;

export const TRACKING_TOOL_DEFINITIONS = [
  {
    name: RECORD_MEASUREMENT_TOOL_NAME,
    description:
      "Record a personal dFDA/N-of-1 measurement such as a medication dose, food, symptom, mood, sleep, activity, lab, or vital sign. Use variableName plus category/unit for new variables, or globalVariableId for an existing variable.",
    inputSchema: {
      type: "object" as const,
      properties: {
        globalVariableId: { type: "string" },
        variableName: { type: "string" },
        categoryName: {
          type: "string",
          description:
            "Required when variableName does not already exist. Examples: Treatment, Food, Drink, Nutrient, Symptom, Emotion, Sleep, Activity, Vital Sign, or Biomarker.",
        },
        value: { type: "number" },
        unitId: { type: "string" },
        unitAbbreviation: {
          type: "string",
          description:
            "Short unit such as mg, IU, servings, count, or 1-5. serving and {serving} are accepted aliases for servings.",
        },
        unitName: {
          type: "string",
          description: "Full unit name; matched case-insensitively.",
        },
        startTime: { type: "string", description: "ISO date/time." },
        duration: { type: "number", description: "Duration in seconds." },
        note: { type: "string" },
        sourceName: { type: "string" },
        combinationOperation: { type: "string", enum: ["SUM", "MEAN"] },
        fillingType: {
          type: "string",
          enum: ["ZERO", "NONE", "INTERPOLATION", "VALUE"],
        },
        latitude: { type: "number" },
        longitude: { type: "number" },
      },
      required: ["value"],
    },
  },
  {
    name: "listMeasurements",
    description:
      "List the authenticated user's own recorded measurements, newest first. Covers everything logged through recordMeasurement or a tracking-reminder response. Filter by globalVariableId or variableName for one variable, or omit both to see every variable. Use this to review logged doses, foods, symptoms, moods, sleep, activity, labs, and vitals, or to check whether a reminder was actually answered. Each row carries startTime (UTC) and startTimeLocal (the user's zone): report times to the user from startTimeLocal.",
    inputSchema: {
      type: "object" as const,
      properties: {
        globalVariableId: { type: "string" },
        variableName: {
          type: "string",
          description:
            "Variable name, matched case-insensitively. An unknown variable is an error, not an empty result.",
        },
        startTimeAfter: {
          type: "string",
          description:
            "ISO date/time. Only measurements at or after this time.",
        },
        startTimeBefore: {
          type: "string",
          description:
            "ISO date/time. Only measurements at or before this time.",
        },
        limit: {
          type: "number",
          description: `Page size. Default ${DEFAULT_MEASUREMENT_PAGE_SIZE}, maximum ${MAX_MEASUREMENT_PAGE_SIZE}.`,
        },
        cursor: {
          type: "string",
          description:
            "nextCursor from the previous page. Repeat the same filters until nextCursor is null.",
        },
      },
    },
  },
  {
    name: UPDATE_MEASUREMENT_TOOL_NAME,
    description:
      "Correct one of the authenticated user's measurements by ID. Use listMeasurements to get the ID. Pass value in the normalized unit. If the measurement was converted between units, also pass originalValue in its original unit. Units and variable identity stay unchanged. Optional metadata fields patch the existing row. The tool rejects measurements owned by another user and refreshes cached summaries.",
    inputSchema: {
      type: "object" as const,
      properties: {
        measurementId: { type: "string" },
        value: { type: "number" },
        originalValue: {
          type: "number",
          description:
            "Corrected value in the existing original unit. Required when originalUnitId differs from unitId; otherwise defaults to value.",
        },
        duration: {
          type: ["number", "null"],
          description: "Duration in seconds. Null clears it.",
        },
        note: { type: ["string", "null"] },
        sourceName: { type: ["string", "null"] },
        latitude: { type: ["number", "null"] },
        longitude: { type: ["number", "null"] },
      },
      required: ["measurementId", "value"],
    },
  },
  {
    name: DELETE_MEASUREMENT_TOOL_NAME,
    description:
      "Soft-delete one of the authenticated user's measurements by ID. Use listMeasurements to get the ID. The tool rejects measurements owned by another user and refreshes cached summaries.",
    inputSchema: {
      type: "object" as const,
      properties: {
        measurementId: { type: "string" },
      },
      required: ["measurementId"],
    },
  },
  {
    name: "upsertTrackingReminder",
    description:
      "Create or edit a personal tracking reminder for medications, food, symptoms, mood, sleep, activity, labs, or vitals. When creating a new variable, pass categoryName; Food defaults to servings. To edit a reminder in place, pass trackingReminderId plus only the fields to change. Omit trackingReminderId to create or idempotently update the reminder identified by variable, start time, and frequency. Unit fields set your personal recording unit for the variable; the canonical variable default is unchanged. The response's top-level unit is the unit answers record in. The reminder can later be answered as TRACKED (value 0 for a not-taken day) or SNOOZED.",
    inputSchema: {
      type: "object" as const,
      anyOf: [
        { required: ["trackingReminderId"] },
        { required: ["reminderStartTime"] },
      ],
      properties: {
        trackingReminderId: {
          type: "string",
          description:
            "Existing reminder ID to edit in place. Patchable: active, defaultValue, instructions, reminderStartTime, reminderEndTime, reminderFrequency, startTrackingDate, stopTrackingDate, unit fields, and fillingType. Fixed at creation: the tracked variable (variableName, globalVariableId, categoryName, combinationOperation) — to change it, create a new reminder and set active: false on this one.",
        },
        globalVariableId: { type: "string" },
        variableName: { type: "string" },
        categoryName: {
          type: "string",
          description:
            "Required when variableName does not already exist. Examples: Treatment, Food, Drink, Nutrient, Symptom, Emotion, Sleep, Activity, Vital Sign, or Biomarker.",
        },
        defaultValue: {
          type: ["number", "null"],
          description:
            "Pre-filled value, such as a normal medication dose or symptom rating. Pass null to clear it when editing.",
        },
        unitId: { type: "string" },
        unitAbbreviation: {
          type: "string",
          description:
            "Short unit such as mg, IU, servings, count, or 1-5. serving and {serving} are accepted aliases for servings. Sets your personal recording unit for this variable, on create or on edit.",
        },
        unitName: {
          type: "string",
          description: "Full unit name; matched case-insensitively.",
        },
        reminderStartTime: {
          type: "string",
          description: "Local wall-clock time in HH:mm, for example 08:00.",
        },
        reminderEndTime: {
          type: ["string", "null"],
          description:
            "Optional local end/quiet time in HH:mm. Pass null to clear it when editing.",
        },
        reminderFrequency: {
          type: "number",
          description: "Seconds between reminders. Default 86400.",
        },
        active: { type: "boolean" },
        instructions: { type: ["string", "null"] },
        startTrackingDate: {
          type: ["string", "null"],
          description: "ISO date/time, or null to clear it when editing.",
        },
        stopTrackingDate: {
          type: ["string", "null"],
          description: "ISO date/time, or null to clear it when editing.",
        },
        combinationOperation: { type: "string", enum: ["SUM", "MEAN"] },
        fillingType: {
          type: "string",
          enum: ["ZERO", "NONE", "INTERPOLATION", "VALUE"],
        },
      },
    },
  },
  {
    name: "listTrackingReminders",
    description:
      "List the authenticated user's personal tracking reminders, active by default. Returns a compact shape by default: id, name, schedule, defaultValue, recording unit, fillingType, and an instructions preview. Pass compact: false for full records. Use getTrackingReminder for one reminder with full instructions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        includeInactive: { type: "boolean" },
        compact: {
          type: "boolean",
          description:
            "Defaults to true. Pass false for full records with expanded variable and unit objects and untruncated instructions.",
        },
      },
    },
  },
  {
    name: "getTrackingReminder",
    description:
      "Get one of the authenticated user's tracking reminders in full, including untruncated instructions, the expanded variable, and the effective recording unit. Use listTrackingReminders to find the ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        trackingReminderId: { type: "string" },
      },
      required: ["trackingReminderId"],
    },
  },
  {
    name: "listTrackingReminderNotifications",
    description:
      "List the authenticated user's tracking notification queue for one local day or an inclusive local-date range. A reminder defines a schedule; a notification is one occurrence. Filter by trackingReminderId or effective status, including OVERDUE. The default compact shape carries id (the trackingReminderId to answer with), name, due (local time), status, defaultValue, unit, and fillingType, so an agent can answer without a second lookup. An OVERDUE item with sameDayMeasurementCount already has same-day data for its variable recorded outside this notification: verify with listMeasurements before answering again, or you may duplicate data. Pass compact: false for full records with scheduledAt, effective notifyAt, and snoozedUntil. Set includeCompleted to include recent TRACKED notifications.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dateKey: {
          type: "string",
          description:
            "One local date in YYYY-MM-DD. Defaults to today. Do not combine with startDateKey or endDateKey.",
        },
        startDateKey: {
          type: "string",
          description:
            "First local date in an inclusive range. Defaults to endDateKey when omitted.",
        },
        endDateKey: {
          type: "string",
          description:
            "Last local date in an inclusive range. Defaults to startDateKey when omitted. Ranges may include at most 31 days.",
        },
        trackingReminderId: {
          type: "string",
          description: "Return occurrences for only this reminder.",
        },
        status: {
          type: "string",
          enum: ["PENDING", "SENT", "TRACKED", "SKIPPED", "SNOOZED", "OVERDUE"],
          description:
            "Return only this effective status. An elapsed snooze becomes PENDING or OVERDUE. OVERDUE means effective notifyAt is in the past and the occurrence remains unanswered.",
        },
        compact: {
          type: "boolean",
          description:
            "Defaults to true. Pass false for full records including scheduledAt, snooze detail, and instructions.",
        },
        includeCompleted: {
          type: "boolean",
          description:
            "Include answered TRACKED or legacy SKIPPED occurrences. SNOOZED occurrences are always returned with snoozedUntil.",
        },
      },
    },
  },
  {
    name: "listDueTrackingReminders",
    description:
      "Deprecated alias for listTrackingReminderNotifications. It keeps the reminders response key for existing callers.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dateKey: {
          type: "string",
          description: "Local date in YYYY-MM-DD. Defaults to today.",
        },
        compact: {
          type: "boolean",
          description:
            "Return trackingReminderId as id, plus name, due, and status.",
        },
        includeCompleted: {
          type: "boolean",
          description:
            "When true, include reminders already answered or snoozed for the date.",
        },
      },
    },
  },
  {
    name: "respondToTrackingReminderNotifications",
    description:
      "Answer several tracking reminder notifications in one call. To answer specific reminders, send only except entries and omit defaultStatus; every other reminder stays untouched. Send defaultStatus only when you intend to answer the whole day. An except entry can also correct a response you already recorded. All-or-nothing: if any exception ID is not scheduled for the date, the tool writes nothing and returns an error. The call targets one local date; when catching up a past day (for example after midnight), pass that day's dateKey. Each result reports notifyAtLocal, the occurrence the answer landed on: verify it is the day you meant.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dateKey: {
          type: "string",
          description: "Local date in YYYY-MM-DD. Defaults to today.",
        },
        defaultStatus: {
          type: "string",
          enum: ["TRACKED", "SNOOZED"],
          description:
            "Optional. Apply this status to every due and unanswered notification without an exception. Omit it to answer only the except entries. Already-answered notifications are never touched by the default.",
        },
        except: {
          type: "array",
          description:
            "Answer or correct individual notifications by trackingReminderId. Each entry needs a status when defaultStatus is omitted.",
          items: {
            type: "object",
            properties: {
              trackingReminderId: { type: "string" },
              status: {
                type: "string",
                enum: ["TRACKED", "SNOOZED"],
              },
              value: { type: "number" },
              snoozeMinutes: { type: "number" },
              note: { type: "string" },
            },
            required: ["trackingReminderId"],
          },
        },
        note: { type: "string" },
        snoozeMinutes: {
          type: "number",
          description:
            "Set the snooze duration. The default is 30 minutes. The server caps the deferred time at the local day's end.",
        },
      },
    },
  },
  {
    name: "respondToTrackingReminder",
    description:
      "Answer a due tracking reminder. TRACKED records a measurement. Record value 0 when the treatment, food, or activity was not taken; those zero days are the baseline that causal analysis needs. SNOOZED defers the notification. Deactivate the reminder when it no longer applies. SKIPPED is retired: it now records a zero and returns a deprecation notice. When dateKey and trackedAt are omitted, the answer targets the reminder's most recent due occurrence within the last 7 days that is still unanswered — so an after-midnight catch-up resolves yesterday's occurrence, not tomorrow's. The response's notifyAtLocal shows where the answer landed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        trackingReminderId: { type: "string" },
        status: {
          type: "string",
          enum: ["TRACKED", "SNOOZED"],
          description:
            "TRACKED records a measurement; pass value 0 for a not-taken day. SNOOZED defers the notification. SKIPPED is accepted but retired and records a zero.",
        },
        snoozeMinutes: {
          type: "number",
          description:
            "Set the snooze duration. The default is 30 minutes. The server caps the deferred time at the local day's end.",
        },
        value: {
          type: "number",
          description:
            "Override dose/rating/value. If omitted for TRACKED, the reminder defaultValue is used.",
        },
        unitId: { type: "string" },
        unitAbbreviation: { type: "string" },
        unitName: { type: "string" },
        trackedAt: {
          type: "string",
          description:
            "ISO date/time the measurement actually happened. Also anchors the target day when dateKey is omitted.",
        },
        dateKey: {
          type: "string",
          description:
            "Local date in YYYY-MM-DD of the occurrence to answer. Defaults from trackedAt when given, else to the most recent unanswered due occurrence.",
        },
        note: { type: "string" },
        sourceName: { type: "string" },
      },
      required: ["trackingReminderId", "status"],
    },
  },
] as const;

export const TRACKING_TOOL_SCOPES = {
  [RECORD_MEASUREMENT_TOOL_NAME]: [McpScope.TASKS_PERSONAL],
  [UPDATE_MEASUREMENT_TOOL_NAME]: [McpScope.TASKS_PERSONAL],
  [DELETE_MEASUREMENT_TOOL_NAME]: [McpScope.TASKS_PERSONAL],
  listMeasurements: [McpScope.TASKS_PERSONAL],
  upsertTrackingReminder: [McpScope.TASKS_PERSONAL],
  getTrackingReminder: [McpScope.TASKS_PERSONAL],
  listTrackingReminders: [McpScope.TASKS_PERSONAL],
  listDueTrackingReminders: [McpScope.TASKS_PERSONAL],
  listTrackingReminderNotifications: [McpScope.TASKS_PERSONAL],
  respondToTrackingReminder: [McpScope.TASKS_PERSONAL],
  respondToTrackingReminderNotifications: [McpScope.TASKS_PERSONAL],
} satisfies Record<string, McpScope[]>;

export type TrackingToolName = keyof typeof TRACKING_TOOL_SCOPES;

export function isTrackingToolName(name: string): name is TrackingToolName {
  return name in TRACKING_TOOL_SCOPES;
}
