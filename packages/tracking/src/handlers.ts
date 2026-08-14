// MCP call dispatch for the tracking tools, transposed verbatim from the
// switch cases in packages/web/src/lib/mcp-server.ts. Hosts pass their own
// authRequired() so the remediation payload advertises the host's OAuth
// endpoints. Thrown errors propagate to the host's try/catch, matching the
// pre-extraction behavior.
import {
  deleteMeasurementForUser,
  listDueTrackingRemindersForUser,
  listMeasurementsForUser,
  listTrackingReminderNotificationsForUser,
  listTrackingRemindersForUser,
  recordTrackingMeasurement,
  respondToTrackingReminderForUser,
  respondToTrackingReminderNotificationsForUser,
  toCompactTrackingNotifications,
  updateMeasurementForUser,
  upsertTrackingReminderForUser,
} from "./core";
import { stringifyJsonSafe } from "./json";
import {
  DELETE_MEASUREMENT_TOOL_NAME,
  RECORD_MEASUREMENT_TOOL_NAME,
  UPDATE_MEASUREMENT_TOOL_NAME,
  type TrackingToolName,
} from "./tool-definitions";
import type { TrackingToolResponse } from "./types";

export { isTrackingToolName } from "./tool-definitions";

// Mirrors ok() in packages/web/src/lib/mcp-server.ts so responses keep the
// same content + structuredContent shape on both hosts.
function ok(data: unknown): TrackingToolResponse {
  const text = stringifyJsonSafe(data, 2);
  const json = JSON.parse(text) as unknown;
  return {
    content: [{ type: "text" as const, text }],
    ...(json != null && typeof json === "object" && !Array.isArray(json)
      ? { structuredContent: json as Record<string, unknown> }
      : {}),
  };
}

export interface TrackingToolCallInput {
  args: Record<string, unknown>;
  authRequired: (toolName: string, reason: string) => TrackingToolResponse;
  name: TrackingToolName;
  userId: string | null;
}

export async function handleTrackingToolCall({
  args: a,
  authRequired,
  name,
  userId,
}: TrackingToolCallInput): Promise<TrackingToolResponse> {
  switch (name) {
    case RECORD_MEASUREMENT_TOOL_NAME: {
      if (!userId)
        return authRequired(
          name,
          "This tool records your personal tracking measurements.",
        );
      return ok({
        result: await recordTrackingMeasurement(a, userId),
      });
    }

    case "listMeasurements": {
      if (!userId)
        return authRequired(
          name,
          "This tool lists your personal tracking measurements.",
        );
      return ok(await listMeasurementsForUser(a, userId));
    }

    case UPDATE_MEASUREMENT_TOOL_NAME: {
      if (!userId)
        return authRequired(
          name,
          "This tool corrects your personal tracking measurements.",
        );
      return ok({
        measurement: await updateMeasurementForUser(a, userId),
      });
    }

    case DELETE_MEASUREMENT_TOOL_NAME: {
      if (!userId)
        return authRequired(
          name,
          "This tool deletes your personal tracking measurements.",
        );
      return ok({
        measurement: await deleteMeasurementForUser(a, userId),
      });
    }

    case "upsertTrackingReminder": {
      if (!userId)
        return authRequired(
          name,
          "This tool manages your personal tracking reminders.",
        );
      return ok({
        result: await upsertTrackingReminderForUser(a, userId),
      });
    }

    case "listTrackingReminders": {
      if (!userId)
        return authRequired(
          name,
          "This tool lists your personal tracking reminders.",
        );
      return ok({
        reminders: await listTrackingRemindersForUser(a, userId),
      });
    }

    case "listTrackingReminderNotifications":
    case "listDueTrackingReminders": {
      if (!userId)
        return authRequired(
          name,
          "This tool lists your due personal tracking reminder notifications.",
        );
      const result =
        name === "listTrackingReminderNotifications"
          ? await listTrackingReminderNotificationsForUser(a, userId)
          : a.compact === true
            ? toCompactTrackingNotifications(
                await listDueTrackingRemindersForUser(a, userId),
              )
            : await listDueTrackingRemindersForUser(a, userId);
      if (name === "listDueTrackingReminders") {
        const { notifications, ...rest } = result;
        return ok({ ...rest, reminders: notifications });
      }
      return ok(result);
    }

    case "respondToTrackingReminderNotifications": {
      if (!userId)
        return authRequired(
          name,
          "This tool records responses to your tracking reminder notifications.",
        );
      return ok(
        await respondToTrackingReminderNotificationsForUser(a, userId),
      );
    }

    case "respondToTrackingReminder": {
      if (!userId)
        return authRequired(
          name,
          "This tool records your response to a tracking reminder.",
        );
      return ok({
        result: await respondToTrackingReminderForUser(a, userId),
      });
    }
  }
}
