// Personal health-tracking core: measurements, tracking reminders, and
// notification queues. Extracted verbatim from packages/web/src/lib/mcp-server.ts
// so optimitron.com and dfda.earth serve one implementation over one database.
import type { Prisma } from "@optimitron/db";
import {
  CombinationOperation,
  FillingType,
  NotificationStatus,
} from "@optimitron/db/enums";

import { refreshMeasurementSummaries } from "./measurement-summaries";
import {
  isPrismaUniqueConstraintError,
  optionalString,
  optionalStringInput,
  parseEnumInput,
  parseOptionalFiniteNumberInput,
} from "./parse";
import { ensureSubjectForUser } from "./subject";
import {
  formatZonedIsoString,
  getStartOfZonedDayUtc,
  getTimeZoneOffsetMinutes,
  getZonedDateKey,
  getZonedDateTimeUtc,
  parseDateKey as parseZonedDateKey,
  shiftDateKey,
} from "./time-zone";
import type { TrackingPrismaClient } from "./types";

let trackingPrismaProvider: (() => Promise<TrackingPrismaClient>) | null =
  null;

/**
 * Host apps must call this once at startup (packages/web's mcp-server and
 * apps/dfda's MCP route each pass their own singleton). The package never
 * opens a database connection on its own.
 */
export function setTrackingPrismaProvider(
  provider: () => Promise<TrackingPrismaClient>,
) {
  trackingPrismaProvider = provider;
}

async function getPrisma(): Promise<TrackingPrismaClient> {
  if (!trackingPrismaProvider) {
    throw new Error(
      "@optimitron/tracking is not configured. Call setTrackingPrismaProvider() before using tracking tools.",
    );
  }
  return trackingPrismaProvider();
}

type AppPrismaClient = TrackingPrismaClient;
export type TrackingDbClient = Prisma.TransactionClient | AppPrismaClient;

const TRACKING_UNIT_SELECT = {
  abbreviatedName: true,
  id: true,
  name: true,
  ucumCode: true,
} satisfies Prisma.UnitSelect;

const TRACKING_VARIABLE_SELECT = {
  defaultUnit: { select: TRACKING_UNIT_SELECT },
  defaultUnitId: true,
  id: true,
  maximumAllowedValue: true,
  minimumAllowedValue: true,
  name: true,
  variableCategory: { select: { id: true, name: true } },
  variableCategoryId: true,
} satisfies Prisma.GlobalVariableSelect;

const TRACKING_REMINDER_INCLUDE = {
  globalVariable: { select: TRACKING_VARIABLE_SELECT },
  nOf1Variable: {
    select: {
      defaultUnitId: true,
      fillingType: true,
      id: true,
      subjectId: true,
    },
  },
} satisfies Prisma.TrackingReminderInclude;

const TRACKING_NOTIFICATION_WITH_REMINDER_INCLUDE = {
  trackingReminder: { include: TRACKING_REMINDER_INCLUDE },
} satisfies Prisma.TrackingReminderNotificationInclude;

const TRACKING_NOF1_VARIABLE_SELECT = {
  defaultUnit: { select: TRACKING_UNIT_SELECT },
  defaultUnitId: true,
  durationOfAction: true,
  fillingType: true,
  fillingValue: true,
  globalVariable: { select: TRACKING_VARIABLE_SELECT },
  globalVariableId: true,
  id: true,
  latestMeasurementStartAt: true,
  maximumAllowedValue: true,
  minimumAllowedValue: true,
  numberOfMeasurements: true,
  onsetDelay: true,
  updatedAt: true,
} satisfies Prisma.NOf1VariableSelect;

const TRACKING_MEASUREMENT_SELECT = {
  createdAt: true,
  deletedAt: true,
  duration: true,
  globalVariable: { select: TRACKING_VARIABLE_SELECT },
  globalVariableId: true,
  id: true,
  latitude: true,
  longitude: true,
  nOf1VariableId: true,
  note: true,
  originalUnit: { select: TRACKING_UNIT_SELECT },
  originalValue: true,
  sourceName: true,
  startTime: true,
  subjectId: true,
  unit: { select: TRACKING_UNIT_SELECT },
  updatedAt: true,
  value: true,
} satisfies Prisma.MeasurementSelect;

export const DEFAULT_MEASUREMENT_PAGE_SIZE = 100;
export const MAX_MEASUREMENT_PAGE_SIZE = 500;

interface TrackingVariableArgs {
  categoryName?: string | null;
  combinationOperation?: CombinationOperation;
  fillingType?: FillingType;
  globalVariableId?: string | null;
  unitAbbreviation?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  variableName?: string | null;
}

interface RecordTrackingMeasurementArgs extends TrackingVariableArgs {
  duration?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  sourceName?: string | null;
  startTime?: Date | null;
  userId: string;
  value: number;
}

function parseOptionalDateValue(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return value;
    throw new Error(`${fieldName} must be a valid date.`);
  }
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be an ISO date string.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return date;
}

function parseRequiredFiniteNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
  return value;
}

function parseOptionalNonnegativeInteger(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return value;
}

function parsePositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
) {
  if (value == null || value === "") return fallback;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

function parseTimeOfDay(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  const normalized = value.trim();
  if (!/^\d{1,2}:\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  const [rawHours, rawMinutes] = normalized.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`${fieldName} must be HH:mm local time.`);
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function parseOptionalTimeOfDay(value: unknown, fieldName: string) {
  if (value == null || value === "") return null;
  return parseTimeOfDay(value, fieldName);
}

function parseDateKey(
  value: unknown,
  fallback = getZonedDateKey(new Date(), "UTC"),
) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string" || !parseZonedDateKey(value.trim())) {
    throw new Error("dateKey must use YYYY-MM-DD.");
  }
  return value.trim();
}

function dayRange(dateKey: string, timeZone: string) {
  const startParts = parseZonedDateKey(dateKey);
  const nextDateKey = shiftDateKey(dateKey, 1);
  const endParts = nextDateKey ? parseZonedDateKey(nextDateKey) : null;
  if (!startParts || !endParts) throw new Error("Invalid tracking date.");
  return {
    end: getStartOfZonedDayUtc(endParts, timeZone),
    start: getStartOfZonedDayUtc(startParts, timeZone),
  };
}

function reminderNotifyAt(
  dateKey: string,
  reminderStartTime: string,
  timeZone: string,
) {
  const dateParts = parseZonedDateKey(dateKey);
  if (!dateParts) throw new Error("Invalid tracking date.");
  const [hours, minutes] = reminderStartTime.split(":").map(Number);
  return getZonedDateTimeUtc(
    { ...dateParts, hour: hours, minute: minutes, second: 0 },
    timeZone,
  );
}

function reminderOccurrenceWithinRange(
  reminder: {
    createdAt: Date;
    reminderFrequency: number;
    reminderStartTime: string;
    startTrackingDate: Date | null;
  },
  range: { dateKey: string; end: Date; start: Date; timeZone: string },
) {
  const anchorDate = reminder.startTrackingDate ?? reminder.createdAt;
  const anchorDateKey = getZonedDateKey(anchorDate, range.timeZone);
  if (reminder.reminderFrequency <= 0) return null;

  const frequencyDays = reminder.reminderFrequency / 86_400;
  if (Number.isInteger(frequencyDays)) {
    const anchorParts = parseZonedDateKey(anchorDateKey);
    const targetParts = parseZonedDateKey(range.dateKey);
    if (!anchorParts || !targetParts) return null;
    const daysSinceAnchor =
      (Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day) -
        Date.UTC(anchorParts.year, anchorParts.month - 1, anchorParts.day)) /
      86_400_000;
    return daysSinceAnchor >= 0 && daysSinceAnchor % frequencyDays === 0
      ? reminderNotifyAt(
          range.dateKey,
          reminder.reminderStartTime,
          range.timeZone,
        )
      : null;
  }

  const anchor = reminderNotifyAt(
    anchorDateKey,
    reminder.reminderStartTime,
    range.timeZone,
  );
  if (range.end <= anchor) return null;

  const frequencyMilliseconds = reminder.reminderFrequency * 1_000;
  const firstOccurrenceIndex = Math.max(
    0,
    Math.ceil(
      (range.start.getTime() - anchor.getTime()) / frequencyMilliseconds,
    ),
  );
  const firstOccurrence = new Date(
    anchor.getTime() + firstOccurrenceIndex * frequencyMilliseconds,
  );
  return firstOccurrence < range.end ? firstOccurrence : null;
}

enum TrackingReminderDerivedStatus {
  OVERDUE = "OVERDUE",
}

function cleanNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseTrackingVariableArgs(
  input: Record<string, unknown>,
): TrackingVariableArgs {
  return {
    categoryName: optionalString(input.categoryName),
    combinationOperation: parseEnumInput(
      CombinationOperation,
      input.combinationOperation,
      "combinationOperation",
    ),
    fillingType: parseEnumInput(FillingType, input.fillingType, "fillingType"),
    globalVariableId: optionalString(input.globalVariableId),
    unitAbbreviation: optionalString(input.unitAbbreviation),
    unitId: optionalString(input.unitId),
    unitName: optionalString(input.unitName),
    variableName: optionalString(input.variableName),
  };
}

async function resolveTrackingUnit(
  db: TrackingDbClient,
  input: Pick<TrackingVariableArgs, "unitAbbreviation" | "unitId" | "unitName">,
) {
  if (input.unitId) {
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: { deletedAt: null, id: input.unitId },
    });
  }
  if (input.unitAbbreviation) {
    const normalizedAbbreviation = normalizeTrackingUnitAlias(
      input.unitAbbreviation,
      "servings",
    );
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: { abbreviatedName: normalizedAbbreviation, deletedAt: null },
    });
  }
  if (input.unitName) {
    const normalizedName = normalizeTrackingUnitAlias(
      input.unitName,
      "Servings",
    );
    return db.unit.findFirst({
      select: TRACKING_UNIT_SELECT,
      where: {
        deletedAt: null,
        name: { equals: normalizedName, mode: "insensitive" },
      },
    });
  }
  return null;
}

function normalizeTrackingUnitAlias(value: string, servingUnit: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "serving" ||
    normalized === "servings" ||
    normalized === "{serving}"
    ? servingUnit
    : value;
}

async function resolveTrackingVariable(
  db: TrackingDbClient,
  input: TrackingVariableArgs,
) {
  if (input.globalVariableId) {
    const variable = await db.globalVariable.findFirst({
      select: TRACKING_VARIABLE_SELECT,
      where: { deletedAt: null, id: input.globalVariableId },
    });
    if (!variable) {
      throw new Error(`GlobalVariable not found: ${input.globalVariableId}`);
    }
    const requestedUnit = await resolveTrackingUnit(db, input);
    if (
      (input.unitAbbreviation || input.unitId || input.unitName) &&
      !requestedUnit
    ) {
      throw new Error("Requested unit was not found.");
    }
    return { unit: requestedUnit ?? variable.defaultUnit, variable };
  }

  if (!input.variableName) {
    throw new Error("Provide globalVariableId or variableName.");
  }

  const existing = await db.globalVariable.findFirst({
    select: TRACKING_VARIABLE_SELECT,
    where: { deletedAt: null, name: input.variableName },
  });
  if (existing) {
    const requestedUnit = await resolveTrackingUnit(db, input);
    if (
      (input.unitAbbreviation || input.unitId || input.unitName) &&
      !requestedUnit
    ) {
      throw new Error("Requested unit was not found.");
    }
    return { unit: requestedUnit ?? existing.defaultUnit, variable: existing };
  }

  if (!input.categoryName) {
    throw new Error(
      `categoryName is required when creating the new tracking variable "${input.variableName}". Use Food for foods, Drink for beverages, Nutrient for nutrients, Treatment for medications, Symptom for symptoms, or another seeded category.`,
    );
  }
  const categoryName = input.categoryName;
  const category = await db.variableCategory.findFirst({
    select: {
      combinationOperation: true,
      defaultUnit: { select: TRACKING_UNIT_SELECT },
      defaultUnitId: true,
      durationOfAction: true,
      id: true,
      name: true,
      onsetDelay: true,
      outcome: true,
      predictorOnly: true,
    },
    where: {
      deletedAt: null,
      name: { equals: categoryName, mode: "insensitive" },
    },
  });
  if (!category?.defaultUnitId) {
    throw new Error(
      `Variable category is not seeded or has no default unit: ${categoryName}`,
    );
  }

  const requestedUnit = await resolveTrackingUnit(db, input);
  if (
    (input.unitAbbreviation || input.unitId || input.unitName) &&
    !requestedUnit
  ) {
    throw new Error("Requested unit was not found.");
  }
  const unit = requestedUnit ?? category.defaultUnit;
  if (!unit) {
    throw new Error(`No unit available for variable category: ${categoryName}`);
  }

  const variable = await db.globalVariable.upsert({
    create: {
      combinationOperation:
        input.combinationOperation ?? category.combinationOperation,
      defaultUnitId: unit.id,
      durationOfAction: category.durationOfAction,
      fillingType: input.fillingType ?? FillingType.NONE,
      name: input.variableName,
      onsetDelay: category.onsetDelay,
      outcome: category.outcome,
      predictorOnly: category.predictorOnly,
      variableCategoryId: category.id,
    },
    select: TRACKING_VARIABLE_SELECT,
    update: {
      deletedAt: null,
    },
    where: { name: input.variableName },
  });

  return { unit, variable };
}

async function trackingUserSubject(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const user = await tx.user.findUniqueOrThrow({
    select: { email: true, id: true, personId: true },
    where: { id: userId },
  });
  return ensureSubjectForUser(tx, user);
}

async function ensureTrackingNOf1Variable(
  db: TrackingDbClient,
  input: {
    defaultUnitId: string;
    fillingType?: FillingType;
    globalVariableId: string;
    subjectId: string;
  },
) {
  return db.nOf1Variable.upsert({
    create: {
      defaultUnitId: input.defaultUnitId,
      fillingType: input.fillingType ?? FillingType.NONE,
      globalVariableId: input.globalVariableId,
      subjectId: input.subjectId,
    },
    update: {
      defaultUnitId: input.defaultUnitId,
      ...(input.fillingType ? { fillingType: input.fillingType } : {}),
    },
    where: {
      subjectId_globalVariableId: {
        globalVariableId: input.globalVariableId,
        subjectId: input.subjectId,
      },
    },
  });
}

export async function recordTrackingMeasurementWithTx(
  tx: Prisma.TransactionClient,
  input: RecordTrackingMeasurementArgs,
) {
  const subject = await trackingUserSubject(tx, input.userId);
  const { unit, variable } = await resolveTrackingVariable(tx, input);
  const nOf1Variable = await ensureTrackingNOf1Variable(tx, {
    defaultUnitId: unit.id,
    fillingType: input.fillingType,
    globalVariableId: variable.id,
    subjectId: subject.id,
  });
  const startTime = input.startTime ?? new Date();
  const measurement = await tx.measurement.upsert({
    create: {
      duration: input.duration,
      globalVariableId: variable.id,
      latitude: input.latitude,
      longitude: input.longitude,
      nOf1VariableId: nOf1Variable.id,
      note: input.note,
      originalUnitId: unit.id,
      originalValue: input.value,
      recordedByUserId: input.userId,
      sourceName: input.sourceName ?? "mcp",
      startTime,
      subjectId: subject.id,
      unitId: unit.id,
      value: input.value,
    },
    update: {
      deletedAt: null,
      duration: input.duration,
      latitude: input.latitude,
      longitude: input.longitude,
      note: input.note,
      originalUnitId: unit.id,
      originalValue: input.value,
      recordedByUserId: input.userId,
      sourceName: input.sourceName ?? "mcp",
      unitId: unit.id,
      value: input.value,
    },
    where: {
      subjectId_globalVariableId_startTime: {
        globalVariableId: variable.id,
        startTime,
        subjectId: subject.id,
      },
    },
  });
  await refreshMeasurementSummaries(tx, {
    globalVariableId: variable.id,
    nOf1VariableId: nOf1Variable.id,
  });
  return {
    globalVariable: variable,
    measurement,
    nOf1Variable,
    subjectId: subject.id,
  };
}

export async function recordTrackingMeasurement(
  input: Record<string, unknown>,
  userId: string,
) {
  const value = parseRequiredFiniteNumber(input.value, "value");
  const prisma = await getPrisma();
  return prisma.$transaction((tx) =>
    recordTrackingMeasurementWithTx(tx, {
      ...parseTrackingVariableArgs(input),
      duration: parseOptionalNonnegativeInteger(input.duration, "duration"),
      latitude: parseOptionalFiniteNumberInput(input, "latitude") ?? null,
      longitude: parseOptionalFiniteNumberInput(input, "longitude") ?? null,
      note: optionalString(input.note),
      sourceName: optionalString(input.sourceName),
      startTime: parseOptionalDateValue(input.startTime, "startTime"),
      userId,
      value,
    }),
  );
}

async function findOwnedMeasurementForMutation(
  tx: Prisma.TransactionClient,
  measurementId: string,
  userId: string,
) {
  const measurement = await tx.measurement.findFirst({
    select: {
      globalVariableId: true,
      id: true,
      nOf1VariableId: true,
      originalUnitId: true,
      unitId: true,
    },
    where: {
      deletedAt: null,
      id: measurementId,
      subject: { userId },
    },
  });
  if (!measurement) {
    throw new Error(`Measurement not found: ${measurementId}`);
  }
  return measurement;
}

export async function updateMeasurementForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const measurementId = optionalString(input.measurementId);
  if (!measurementId) {
    throw new Error(
      "measurementId is required. Use listMeasurements to find the measurement ID.",
    );
  }
  const value = parseRequiredFiniteNumber(input.value, "value");
  const suppliedOriginalValue = parseOptionalFiniteNumberInput(
    input,
    "originalValue",
  );
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const existing = await findOwnedMeasurementForMutation(
      tx,
      measurementId,
      userId,
    );
    if (
      existing.originalUnitId !== existing.unitId &&
      suppliedOriginalValue === undefined
    ) {
      throw new Error(
        "originalValue is required because this measurement was converted between different units. Pass value in the normalized unit and originalValue in the original unit.",
      );
    }
    const measurement = await tx.measurement.update({
      data: {
        value,
        originalValue: suppliedOriginalValue ?? value,
        ...(input.duration !== undefined
          ? {
              duration: parseOptionalNonnegativeInteger(
                input.duration,
                "duration",
              ),
            }
          : {}),
        ...(input.latitude !== undefined
          ? {
              latitude:
                parseOptionalFiniteNumberInput(input, "latitude") ?? null,
            }
          : {}),
        ...(input.longitude !== undefined
          ? {
              longitude:
                parseOptionalFiniteNumberInput(input, "longitude") ?? null,
            }
          : {}),
        ...(input.note !== undefined
          ? { note: optionalStringInput(input, "note") }
          : {}),
        ...(input.sourceName !== undefined
          ? { sourceName: optionalStringInput(input, "sourceName") }
          : {}),
      },
      select: TRACKING_MEASUREMENT_SELECT,
      where: { id: existing.id },
    });
    await refreshMeasurementSummaries(tx, existing);
    return measurement;
  });
}

export async function deleteMeasurementForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const measurementId = optionalString(input.measurementId);
  if (!measurementId) {
    throw new Error(
      "measurementId is required. Use listMeasurements to find the measurement ID.",
    );
  }
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const existing = await findOwnedMeasurementForMutation(
      tx,
      measurementId,
      userId,
    );
    const measurement = await tx.measurement.update({
      data: { deletedAt: new Date() },
      select: TRACKING_MEASUREMENT_SELECT,
      where: { id: existing.id },
    });
    await refreshMeasurementSummaries(tx, existing);
    return measurement;
  });
}

export async function upsertTrackingReminderForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const trackingReminderId = optionalString(input.trackingReminderId);
  if ("trackingReminderId" in input && !trackingReminderId) {
    throw new Error("trackingReminderId must be a non-empty string.");
  }
  if (trackingReminderId) {
    const immutableVariableFields = [
      "categoryName",
      "combinationOperation",
      "fillingType",
      "globalVariableId",
      "unitAbbreviation",
      "unitId",
      "unitName",
      "variableName",
    ].filter((fieldName) => fieldName in input);
    if (immutableVariableFields.length > 0) {
      throw new Error(
        `A reminder's tracked variable cannot be changed. Omit ${immutableVariableFields.join(
          ", ",
        )} when editing by trackingReminderId.`,
      );
    }

    const update: Prisma.TrackingReminderUpdateInput = {};
    if ("active" in input) {
      if (typeof input.active !== "boolean") {
        throw new Error("active must be a boolean.");
      }
      update.active = input.active;
    }
    const defaultValue = parseOptionalFiniteNumberInput(input, "defaultValue");
    if (defaultValue !== undefined) update.defaultValue = defaultValue;
    const instructions = optionalStringInput(input, "instructions");
    if (instructions !== undefined) update.instructions = instructions;
    if ("reminderEndTime" in input) {
      update.reminderEndTime = parseOptionalTimeOfDay(
        input.reminderEndTime,
        "reminderEndTime",
      );
    }
    if ("reminderFrequency" in input) {
      if (input.reminderFrequency == null || input.reminderFrequency === "") {
        throw new Error("reminderFrequency must be a positive integer.");
      }
      update.reminderFrequency = parsePositiveInteger(
        input.reminderFrequency,
        "reminderFrequency",
        86_400,
      );
    }
    if ("reminderStartTime" in input) {
      update.reminderStartTime = parseTimeOfDay(
        input.reminderStartTime,
        "reminderStartTime",
      );
    }
    if ("startTrackingDate" in input) {
      update.startTrackingDate = parseOptionalDateValue(
        input.startTrackingDate,
        "startTrackingDate",
      );
    }
    if ("stopTrackingDate" in input) {
      update.stopTrackingDate = parseOptionalDateValue(
        input.stopTrackingDate,
        "stopTrackingDate",
      );
    }

    const prisma = await getPrisma();
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.trackingReminder.findFirst({
          include: TRACKING_REMINDER_INCLUDE,
          where: {
            deletedAt: null,
            id: trackingReminderId,
            userId,
          },
        });
        if (!existing) {
          throw new Error(`TrackingReminder not found: ${trackingReminderId}`);
        }
        if (Object.keys(update).length === 0) {
          return {
            reminder: existing,
            subjectId: existing.nOf1Variable.subjectId,
          };
        }
        const reminder = await tx.trackingReminder.update({
          data: update,
          include: TRACKING_REMINDER_INCLUDE,
          where: { id: existing.id },
        });
        return {
          reminder,
          subjectId: reminder.nOf1Variable.subjectId,
        };
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new Error(
          "Another tracking reminder already uses this variable, start time, and frequency.",
        );
      }
      throw error;
    }
  }

  const reminderStartTime = parseTimeOfDay(
    input.reminderStartTime,
    "reminderStartTime",
  );
  const reminderFrequency = parsePositiveInteger(
    input.reminderFrequency,
    "reminderFrequency",
    86_400,
  );
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const subject = await trackingUserSubject(tx, userId);
    const variableArgs = parseTrackingVariableArgs(input);
    const { unit, variable } = await resolveTrackingVariable(tx, variableArgs);
    const nOf1Variable = await ensureTrackingNOf1Variable(tx, {
      defaultUnitId: unit.id,
      fillingType: variableArgs.fillingType,
      globalVariableId: variable.id,
      subjectId: subject.id,
    });
    const reminder = await tx.trackingReminder.upsert({
      create: {
        active: typeof input.active === "boolean" ? input.active : true,
        defaultValue:
          parseOptionalFiniteNumberInput(input, "defaultValue") ?? null,
        globalVariableId: variable.id,
        instructions: optionalString(input.instructions),
        nOf1VariableId: nOf1Variable.id,
        reminderEndTime: parseOptionalTimeOfDay(
          input.reminderEndTime,
          "reminderEndTime",
        ),
        reminderFrequency,
        reminderStartTime,
        startTrackingDate: parseOptionalDateValue(
          input.startTrackingDate,
          "startTrackingDate",
        ),
        stopTrackingDate: parseOptionalDateValue(
          input.stopTrackingDate,
          "stopTrackingDate",
        ),
        userId,
      },
      include: TRACKING_REMINDER_INCLUDE,
      update: {
        active: typeof input.active === "boolean" ? input.active : true,
        defaultValue:
          parseOptionalFiniteNumberInput(input, "defaultValue") ?? null,
        deletedAt: null,
        instructions: optionalString(input.instructions),
        nOf1VariableId: nOf1Variable.id,
        reminderEndTime: parseOptionalTimeOfDay(
          input.reminderEndTime,
          "reminderEndTime",
        ),
        startTrackingDate: parseOptionalDateValue(
          input.startTrackingDate,
          "startTrackingDate",
        ),
        stopTrackingDate: parseOptionalDateValue(
          input.stopTrackingDate,
          "stopTrackingDate",
        ),
      },
      where: {
        userId_globalVariableId_reminderStartTime_reminderFrequency: {
          globalVariableId: variable.id,
          reminderFrequency,
          reminderStartTime,
          userId,
        },
      },
    });
    return { reminder, subjectId: subject.id };
  });
}

export async function listMeasurementsForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const limit = parsePositiveInteger(
    input.limit,
    "limit",
    DEFAULT_MEASUREMENT_PAGE_SIZE,
  );
  if (limit > MAX_MEASUREMENT_PAGE_SIZE) {
    throw new Error(`limit must be ${MAX_MEASUREMENT_PAGE_SIZE} or less.`);
  }
  const cursor = optionalString(input.cursor);
  const startTimeAfter = parseOptionalDateValue(
    input.startTimeAfter,
    "startTimeAfter",
  );
  const startTimeBefore = parseOptionalDateValue(
    input.startTimeBefore,
    "startTimeBefore",
  );
  if (
    startTimeAfter &&
    startTimeBefore &&
    startTimeAfter.getTime() > startTimeBefore.getTime()
  ) {
    throw new Error("startTimeAfter must be at or before startTimeBefore.");
  }
  const globalVariableId = optionalString(input.globalVariableId);
  const variableName = optionalString(input.variableName);

  const prisma = await getPrisma();
  // Read-only variable lookup: unlike recordMeasurement this must never create
  // a GlobalVariable, and an unknown name is an error rather than an empty page.
  let variable: Prisma.GlobalVariableGetPayload<{
    select: typeof TRACKING_VARIABLE_SELECT;
  }> | null = null;
  if (globalVariableId) {
    variable = await prisma.globalVariable.findFirst({
      select: TRACKING_VARIABLE_SELECT,
      where: { deletedAt: null, id: globalVariableId },
    });
    if (!variable) {
      throw new Error(`GlobalVariable not found: ${globalVariableId}`);
    }
  } else if (variableName) {
    // Case-insensitive matches can be ambiguous: recordMeasurement looks up
    // and creates variables by exact-case name, so "Vitamin D" and "vitamin d"
    // can both exist despite the DB unique constraint being case-sensitive.
    const matches = await prisma.globalVariable.findMany({
      select: TRACKING_VARIABLE_SELECT,
      where: {
        deletedAt: null,
        name: { equals: variableName, mode: "insensitive" as const },
      },
      take: 2,
    });
    if (matches.length === 0) {
      throw new Error(`GlobalVariable not found: ${variableName}`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Multiple variables match "${variableName}" case-insensitively. Use globalVariableId to disambiguate.`,
      );
    }
    variable = matches[0] ?? null;
  }

  const rows = await prisma.measurement.findMany({
    orderBy: [{ startTime: "desc" }, { id: "desc" }],
    select: TRACKING_MEASUREMENT_SELECT,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    where: {
      deletedAt: null,
      subject: { userId },
      ...(variable ? { globalVariableId: variable.id } : {}),
      ...(startTimeAfter || startTimeBefore
        ? {
            startTime: {
              ...(startTimeAfter ? { gte: startTimeAfter } : {}),
              ...(startTimeBefore ? { lte: startTimeBefore } : {}),
            },
          }
        : {}),
    },
  });

  const measurements = rows.slice(0, limit);
  return {
    measurements,
    nextCursor:
      rows.length > limit
        ? (measurements[measurements.length - 1]?.id ?? null)
        : null,
    variable,
  };
}

export async function listTrackingVariablesForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const limit = parsePositiveInteger(
    input.limit,
    "limit",
    DEFAULT_MEASUREMENT_PAGE_SIZE,
  );
  if (limit > MAX_MEASUREMENT_PAGE_SIZE) {
    throw new Error(`limit must be ${MAX_MEASUREMENT_PAGE_SIZE} or less.`);
  }
  const cursor = optionalString(input.cursor);
  const query = optionalString(input.query);

  const prisma = await getPrisma();
  const rows = await prisma.nOf1Variable.findMany({
    orderBy: [
      { latestMeasurementStartAt: { nulls: "last", sort: "desc" } },
      { updatedAt: "desc" },
      { id: "desc" },
    ],
    select: TRACKING_NOF1_VARIABLE_SELECT,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    where: {
      deletedAt: null,
      subject: { userId },
      ...(query
        ? {
            globalVariable: {
              name: { contains: query, mode: "insensitive" as const },
            },
          }
        : {}),
    },
  });

  const variables = rows.slice(0, limit);
  return {
    nextCursor:
      rows.length > limit
        ? (variables[variables.length - 1]?.id ?? null)
        : null,
    variables,
  };
}

export async function updateTrackingVariableSettingsForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const globalVariableId = optionalString(input.globalVariableId);
  const variableName = optionalString(input.variableName);
  let variableWhere: Prisma.NOf1VariableWhereInput;
  if (globalVariableId) {
    variableWhere = { globalVariableId };
  } else if (variableName) {
    variableWhere = {
      globalVariable: {
        deletedAt: null,
        name: { equals: variableName, mode: "insensitive" },
      },
    };
  } else {
    throw new Error("Provide globalVariableId or variableName.");
  }

  // Per-user overrides only: the canonical GlobalVariable is never touched.
  const update: Prisma.NOf1VariableUncheckedUpdateInput = {};
  if ("fillingType" in input) {
    const fillingType = parseEnumInput(
      FillingType,
      input.fillingType,
      "fillingType",
    );
    if (!fillingType) {
      throw new Error(
        `fillingType must be one of: ${Object.keys(FillingType).join(", ")}.`,
      );
    }
    update.fillingType = fillingType;
  }
  const fillingValue = parseOptionalFiniteNumberInput(input, "fillingValue");
  if (fillingValue !== undefined) update.fillingValue = fillingValue;
  const minimumAllowedValue = parseOptionalFiniteNumberInput(
    input,
    "minimumAllowedValue",
  );
  if (minimumAllowedValue !== undefined) {
    update.minimumAllowedValue = minimumAllowedValue;
  }
  const maximumAllowedValue = parseOptionalFiniteNumberInput(
    input,
    "maximumAllowedValue",
  );
  if (maximumAllowedValue !== undefined) {
    update.maximumAllowedValue = maximumAllowedValue;
  }
  if ("onsetDelay" in input) {
    update.onsetDelay = parseOptionalNonnegativeInteger(
      input.onsetDelay,
      "onsetDelay",
    );
  }
  if ("durationOfAction" in input) {
    update.durationOfAction = parseOptionalNonnegativeInteger(
      input.durationOfAction,
      "durationOfAction",
    );
  }

  const unitInput = {
    unitAbbreviation: optionalString(input.unitAbbreviation),
    unitId: optionalString(input.unitId),
    unitName: optionalString(input.unitName),
  };
  const hasUnitInput = Boolean(
    unitInput.unitAbbreviation || unitInput.unitId || unitInput.unitName,
  );

  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const matches = await tx.nOf1Variable.findMany({
      select: TRACKING_NOF1_VARIABLE_SELECT,
      take: 2,
      where: {
        deletedAt: null,
        subject: { userId },
        ...variableWhere,
      },
    });
    const [existing, ambiguous] = matches;
    if (!existing) {
      throw new Error(
        `Tracking variable not found: ${globalVariableId ?? variableName}`,
      );
    }
    if (ambiguous) {
      throw new Error(
        `Multiple variables match "${variableName}" case-insensitively. Use globalVariableId to disambiguate.`,
      );
    }
    if (hasUnitInput) {
      const unit = await resolveTrackingUnit(tx, unitInput);
      if (!unit) throw new Error("Requested unit was not found.");
      update.defaultUnitId = unit.id;
    }
    if (Object.keys(update).length === 0) return existing;
    return tx.nOf1Variable.update({
      data: update,
      select: TRACKING_NOF1_VARIABLE_SELECT,
      where: { id: existing.id },
    });
  });
}

export async function listTrackingRemindersForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const prisma = await getPrisma();
  return prisma.trackingReminder.findMany({
    include: TRACKING_REMINDER_INCLUDE,
    orderBy: [{ active: "desc" }, { reminderStartTime: "asc" }],
    where: {
      deletedAt: null,
      userId,
      ...(input.includeInactive === true ? {} : { active: true }),
    },
  });
}

/** Default snooze length when a caller does not name one. */
const DEFAULT_SNOOZE_MINUTES = 30;
const MAX_TRACKING_NOTIFICATION_RANGE_DAYS = 31;

export async function listDueTrackingRemindersForUser(
  input: Record<string, unknown>,
  userId: string,
  knownTimeZone?: string,
) {
  const prisma = await getPrisma();
  const timeZone =
    knownTimeZone ??
    (
      await prisma.user.findUnique({
        select: { timeZone: true },
        where: { id: userId },
      })
    )?.timeZone ??
    "UTC";
  const dateKey = parseDateKey(
    input.dateKey,
    getZonedDateKey(new Date(), timeZone),
  );
  const { end, start } = dayRange(dateKey, timeZone);
  const reminders = await prisma.trackingReminder.findMany({
    include: TRACKING_REMINDER_INCLUDE,
    orderBy: [{ reminderStartTime: "asc" }],
    where: {
      active: true,
      deletedAt: null,
      userId,
      AND: [
        {
          OR: [
            { startTrackingDate: null },
            { startTrackingDate: { lte: end } },
          ],
        },
        {
          OR: [
            { stopTrackingDate: null },
            { stopTrackingDate: { gte: start } },
          ],
        },
      ],
    },
  });
  const occurrenceByReminderId = new Map<string, Date>();
  const dueReminders = reminders.filter((reminder) => {
    const occurrence = reminderOccurrenceWithinRange(reminder, {
      dateKey,
      end,
      start,
      timeZone,
    });
    if (!occurrence) return false;
    occurrenceByReminderId.set(reminder.id, occurrence);
    return true;
  });
  if (dueReminders.length === 0)
    return { dateKey, notifications: [], timeZone };

  const notifications = await prisma.trackingReminderNotification.findMany({
    orderBy: [{ notifyAt: "asc" }],
    where: {
      deletedAt: null,
      notifyAt: { gte: start, lt: end },
      trackingReminderId: {
        in: dueReminders.map((reminder) => reminder.id),
      },
      userId,
    },
  });
  const byReminderId = new Map(
    notifications.map((notification) => [
      notification.trackingReminderId,
      notification,
    ]),
  );
  const remindersWithStatus = dueReminders
    .map((reminder) => {
      // null = no notification recorded yet for this dateKey (reminder still pending), not an error.
      const existingNotification = byReminderId.get(reminder.id);
      const notification =
        existingNotification === undefined ? null : existingNotification;
      const scheduledAt = occurrenceByReminderId.get(reminder.id);
      const notifyAt = notification?.notifyAt ?? scheduledAt;
      if (!notifyAt || !scheduledAt) {
        throw new Error(
          `Missing scheduled occurrence for tracking reminder ${reminder.id}.`,
        );
      }
      const status = notification?.status ?? NotificationStatus.PENDING;
      const now = Date.now();
      const snoozeElapsed =
        status === NotificationStatus.SNOOZED && notifyAt.getTime() <= now;
      const isOverdue =
        (status === NotificationStatus.PENDING ||
          status === NotificationStatus.SENT ||
          snoozeElapsed) &&
        notifyAt.getTime() < now;
      return {
        dateKey,
        defaultValue: cleanNumber(reminder.defaultValue),
        derivedStatus: isOverdue
          ? TrackingReminderDerivedStatus.OVERDUE
          : snoozeElapsed
            ? NotificationStatus.PENDING
            : status,
        globalVariable: reminder.globalVariable,
        instructions: reminder.instructions,
        isOverdue,
        notification,
        notificationId: notification?.id ?? null,
        notifyAt,
        // Reminders are scheduled in local wall-clock time, so report that
        // alongside the UTC instant. Reading only notifyAt makes an 08:00
        // Central reminder look like it fires at 13:00.
        notifyAtLocal: formatZonedIsoString(notifyAt, timeZone),
        overdueSince: isOverdue ? notifyAt : null,
        overdueSinceLocal: isOverdue
          ? formatZonedIsoString(notifyAt, timeZone)
          : null,
        reminderEndTime: reminder.reminderEndTime,
        reminderFrequency: reminder.reminderFrequency,
        reminderId: reminder.id,
        reminderStartTime: reminder.reminderStartTime,
        scheduledAt,
        scheduledAtLocal: formatZonedIsoString(scheduledAt, timeZone),
        snoozedUntil: status === NotificationStatus.SNOOZED ? notifyAt : null,
        snoozedUntilLocal:
          status === NotificationStatus.SNOOZED
            ? formatZonedIsoString(notifyAt, timeZone)
            : null,
        snoozeDelayMinutes:
          status === NotificationStatus.SNOOZED
            ? Math.max(0, (notifyAt.getTime() - scheduledAt.getTime()) / 60_000)
            : null,
        status,
        timeZone,
        trackedValue: cleanNumber(notification?.trackedValue),
        utcOffsetMinutes: getTimeZoneOffsetMinutes(notifyAt, timeZone),
      };
    })
    .filter((reminder) => {
      if (input.includeCompleted === true) return true;
      if (
        input.includeSnoozed === true &&
        reminder.status === NotificationStatus.SNOOZED
      ) {
        return true;
      }
      if (
        reminder.status === NotificationStatus.SNOOZED &&
        reminder.notifyAt.getTime() <= Date.now()
      ) {
        return true;
      }
      return (
        reminder.status === NotificationStatus.PENDING ||
        reminder.status === NotificationStatus.SENT
      );
    });
  return { dateKey, notifications: remindersWithStatus, timeZone };
}

export function toCompactTrackingNotifications(result: {
  dateKey?: string;
  endDateKey?: string;
  notifications: Array<{
    derivedStatus: NotificationStatus | TrackingReminderDerivedStatus;
    globalVariable: { name: string };
    notifyAt: Date;
    notifyAtLocal: string;
    reminderId: string;
  }>;
  startDateKey?: string;
  timeZone: string;
}) {
  return {
    ...(result.dateKey ? { dateKey: result.dateKey } : {}),
    ...(result.startDateKey ? { startDateKey: result.startDateKey } : {}),
    ...(result.endDateKey ? { endDateKey: result.endDateKey } : {}),
    notifications: result.notifications.map((notification) => ({
      // `due` is the user's local time so a voice client can read it aloud
      // without converting. `dueUtc` keeps the raw instant for machines.
      due: notification.notifyAtLocal,
      dueUtc: notification.notifyAt,
      id: notification.reminderId,
      name: notification.globalVariable.name,
      status: notification.derivedStatus,
    })),
    timeZone: result.timeZone,
  };
}

function parseTrackingNotificationStatus(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error("status must be a string.");
  }
  const normalized = value.trim().toUpperCase();
  const validStatuses = new Set<string>([
    ...Object.values(NotificationStatus),
    TrackingReminderDerivedStatus.OVERDUE,
  ]);
  if (!validStatuses.has(normalized)) {
    throw new Error(`status must be one of ${[...validStatuses].join(", ")}.`);
  }
  return normalized as NotificationStatus | TrackingReminderDerivedStatus;
}

function storedTrackingNotificationToQueueItem(
  notification: Prisma.TrackingReminderNotificationGetPayload<{
    include: typeof TRACKING_NOTIFICATION_WITH_REMINDER_INCLUDE;
  }>,
  timeZone: string,
) {
  const reminder = notification.trackingReminder;
  const notifyAt = notification.notifyAt;
  const dateKey = getZonedDateKey(notifyAt, timeZone);
  const snoozeElapsed =
    notification.status === NotificationStatus.SNOOZED &&
    notifyAt.getTime() <= Date.now();
  const isOverdue =
    (notification.status === NotificationStatus.PENDING ||
      notification.status === NotificationStatus.SENT ||
      snoozeElapsed) &&
    notifyAt.getTime() < Date.now();
  return {
    dateKey,
    defaultValue: cleanNumber(reminder.defaultValue),
    derivedStatus: isOverdue
      ? TrackingReminderDerivedStatus.OVERDUE
      : snoozeElapsed
        ? NotificationStatus.PENDING
        : notification.status,
    globalVariable: reminder.globalVariable,
    instructions: reminder.instructions,
    isOverdue,
    notification,
    notificationId: notification.id,
    notifyAt,
    notifyAtLocal: formatZonedIsoString(notifyAt, timeZone),
    overdueSince: isOverdue ? notifyAt : null,
    overdueSinceLocal: isOverdue
      ? formatZonedIsoString(notifyAt, timeZone)
      : null,
    reminderEndTime: reminder.reminderEndTime,
    reminderFrequency: reminder.reminderFrequency,
    reminderId: reminder.id,
    reminderStartTime: reminder.reminderStartTime,
    // A current schedule cannot reconstruct the historical scheduled instant
    // after the reminder was edited. Keep it null instead of inventing one.
    scheduledAt: null,
    scheduledAtLocal: null,
    snoozedUntil:
      notification.status === NotificationStatus.SNOOZED ? notifyAt : null,
    snoozedUntilLocal:
      notification.status === NotificationStatus.SNOOZED
        ? formatZonedIsoString(notifyAt, timeZone)
        : null,
    snoozeDelayMinutes: null,
    status: notification.status,
    timeZone,
    trackedValue: cleanNumber(notification.trackedValue),
    utcOffsetMinutes: getTimeZoneOffsetMinutes(notifyAt, timeZone),
  };
}

function trackingNotificationDateKeys(
  input: Record<string, unknown>,
  fallbackDateKey: string,
) {
  const hasDateKey = input.dateKey != null && input.dateKey !== "";
  const hasRange =
    (input.startDateKey != null && input.startDateKey !== "") ||
    (input.endDateKey != null && input.endDateKey !== "");
  if (hasDateKey && hasRange) {
    throw new Error(
      "Use dateKey for one day or startDateKey/endDateKey for a range, not both.",
    );
  }
  if (!hasRange) {
    return [parseDateKey(input.dateKey, fallbackDateKey)];
  }

  const endFallback = parseDateKey(input.endDateKey, fallbackDateKey);
  const startDateKey = parseDateKey(input.startDateKey, endFallback);
  const endDateKey = parseDateKey(input.endDateKey, startDateKey);
  if (startDateKey > endDateKey) {
    throw new Error("startDateKey must be on or before endDateKey.");
  }

  const dateKeys: string[] = [];
  let currentDateKey = startDateKey;
  while (true) {
    dateKeys.push(currentDateKey);
    if (currentDateKey === endDateKey) break;
    if (dateKeys.length >= MAX_TRACKING_NOTIFICATION_RANGE_DAYS) {
      throw new Error(
        `Tracking notification ranges may include at most ${MAX_TRACKING_NOTIFICATION_RANGE_DAYS} days.`,
      );
    }
    const nextDateKey = shiftDateKey(currentDateKey, 1);
    if (!nextDateKey) throw new Error("Invalid tracking date range.");
    currentDateKey = nextDateKey;
  }
  return dateKeys;
}

export async function listTrackingReminderNotificationsForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const trackingReminderId = optionalString(input.trackingReminderId);
  if ("trackingReminderId" in input && !trackingReminderId) {
    throw new Error("trackingReminderId must be a non-empty string.");
  }
  const status = parseTrackingNotificationStatus(input.status);
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    select: { timeZone: true },
    where: { id: userId },
  });
  const timeZone = user?.timeZone ?? "UTC";
  const dateKeys = trackingNotificationDateKeys(
    input,
    getZonedDateKey(new Date(), timeZone),
  );
  const dayResults = [];
  for (const dateKey of dateKeys) {
    dayResults.push(
      await listDueTrackingRemindersForUser(
        {
          ...input,
          dateKey,
          includeCompleted: input.includeCompleted === true || status !== null,
          includeSnoozed: true,
        },
        userId,
        timeZone,
      ),
    );
  }
  const scheduledNotifications = dayResults.flatMap(
    (result) => result.notifications,
  );
  const scheduledNotificationIds = new Set(
    scheduledNotifications.flatMap((notification) =>
      notification.notificationId ? [notification.notificationId] : [],
    ),
  );
  const firstRange = dayRange(dateKeys[0], timeZone);
  const lastRange = dayRange(dateKeys[dateKeys.length - 1], timeZone);
  const storedNotifications =
    await prisma.trackingReminderNotification.findMany({
      include: TRACKING_NOTIFICATION_WITH_REMINDER_INCLUDE,
      orderBy: [{ notifyAt: "asc" }],
      where: {
        deletedAt: null,
        notifyAt: { gte: firstRange.start, lt: lastRange.end },
        userId,
      },
    });
  const unmatchedStoredNotifications = storedNotifications
    .filter((notification) => {
      if (scheduledNotificationIds.has(notification.id)) return false;
      if (status !== null) return true;
      const isAnswered =
        notification.status === NotificationStatus.TRACKED ||
        notification.status === NotificationStatus.SKIPPED;
      const isOutstanding =
        notification.status === NotificationStatus.PENDING ||
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.SNOOZED;
      return (
        (input.includeCompleted === true && isAnswered) ||
        (notification.trackingReminder.active && isOutstanding)
      );
    })
    .map((notification) =>
      storedTrackingNotificationToQueueItem(notification, timeZone),
    );
  const notifications = [
    ...scheduledNotifications,
    ...unmatchedStoredNotifications,
  ]
    .filter(
      (notification) =>
        (!trackingReminderId ||
          notification.reminderId === trackingReminderId) &&
        (!status || notification.derivedStatus === status),
    )
    .sort((left, right) => left.notifyAt.getTime() - right.notifyAt.getTime());
  const result =
    dateKeys.length === 1
      ? { dateKey: dateKeys[0], notifications, timeZone }
      : {
          endDateKey: dateKeys[dateKeys.length - 1],
          notifications,
          startDateKey: dateKeys[0],
          timeZone,
        };
  return input.compact === true
    ? toCompactTrackingNotifications(result)
    : result;
}

async function findOrCreateTrackingNotification(
  tx: Prisma.TransactionClient,
  input: {
    deferUntil?: Date | null;
    localDayEnd: Date;
    localDayStart: Date;
    notifyAt: Date;
    status: NotificationStatus;
    trackedValue: number | null;
    trackingReminderId: string;
    userId: string;
  },
) {
  const existing = await tx.trackingReminderNotification.findFirst({
    where: {
      deletedAt: null,
      notifyAt: { gte: input.localDayStart, lt: input.localDayEnd },
      trackingReminderId: input.trackingReminderId,
      userId: input.userId,
    },
  });
  const data = {
    receivedAt: new Date(),
    status: input.status,
    trackedValue: input.trackedValue,
    ...(input.deferUntil ? { notifyAt: input.deferUntil } : {}),
  };
  if (existing) {
    return tx.trackingReminderNotification.update({
      data,
      where: { id: existing.id },
    });
  }
  return tx.trackingReminderNotification.create({
    data: {
      ...data,
      notifyAt: input.deferUntil ?? input.notifyAt,
      trackingReminderId: input.trackingReminderId,
      userId: input.userId,
    },
  });
}

function parseSnoozeMinutes(input: Record<string, unknown>) {
  const snoozeMinutes =
    parseOptionalFiniteNumberInput(input, "snoozeMinutes") ??
    DEFAULT_SNOOZE_MINUTES;
  if (snoozeMinutes <= 0) {
    throw new Error("snoozeMinutes must be greater than 0.");
  }
  return snoozeMinutes;
}

function assertTrackingReminderResponseStatus(
  status: NotificationStatus | undefined,
  fieldName: string,
): asserts status is NotificationStatus {
  if (
    status !== NotificationStatus.TRACKED &&
    status !== NotificationStatus.SKIPPED &&
    status !== NotificationStatus.SNOOZED
  ) {
    throw new Error(`${fieldName} must be TRACKED or SNOOZED.`);
  }
}

/**
 * SKIPPED is retired. A day a treatment, food, or activity was not taken is a
 * zero, not a missing value: the off periods are the baseline that n-of-1
 * causal inference needs. Callers that still send SKIPPED record a zero.
 * Stored SKIPPED rows keep their status; we cannot know after the fact whether
 * an old skip meant zero or meant nobody answered.
 */
function resolveTrackingResponseStatus(status: NotificationStatus) {
  return status === NotificationStatus.SKIPPED
    ? { recordedAsZero: true, status: NotificationStatus.TRACKED }
    : { recordedAsZero: false, status };
}

/**
 * Zero is the right entry for "not taken" only when zero is a value the
 * variable can hold. A 1-5 mood rating has no zero, so nobody answering it is
 * a genuine gap and the caller has to pick: a real value, a snooze, or turning
 * the reminder off.
 */
function assertZeroIsMeasurable(variable: {
  maximumAllowedValue: number | null;
  minimumAllowedValue: number | null;
  name: string;
}) {
  const bound =
    variable.minimumAllowedValue != null && variable.minimumAllowedValue > 0
      ? { label: "below the minimum", value: variable.minimumAllowedValue }
      : variable.maximumAllowedValue != null && variable.maximumAllowedValue < 0
        ? { label: "above the maximum", value: variable.maximumAllowedValue }
        : null;
  if (bound) {
    throw new Error(
      `Zero is ${bound.label} allowed value (${bound.value}) for ${variable.name}, so "not taken" cannot be recorded as zero. Pass an explicit value, use SNOOZED, or deactivate the reminder.`,
    );
  }
}

export async function respondToTrackingReminderNotificationsForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const defaultStatus = parseEnumInput(
    NotificationStatus,
    input.defaultStatus,
    "defaultStatus",
  );
  if (defaultStatus !== undefined) {
    assertTrackingReminderResponseStatus(defaultStatus, "defaultStatus");
  }

  const globalSnoozeMinutes =
    input.snoozeMinutes === undefined ? undefined : parseSnoozeMinutes(input);
  if (input.except !== undefined && !Array.isArray(input.except)) {
    throw new Error("except must be an array of exception entries.");
  }
  const exceptions = Array.isArray(input.except) ? input.except : [];
  const overrideById = new Map<
    string,
    {
      note: unknown;
      snoozeMinutes: number | undefined;
      status: NotificationStatus;
      value: number | null | undefined;
    }
  >();

  if (defaultStatus === undefined && exceptions.length === 0) {
    throw new Error(
      "Provide defaultStatus, at least one except entry, or both. Without either there is nothing to answer.",
    );
  }

  for (const raw of exceptions) {
    if (raw === null || typeof raw !== "object") {
      throw new Error("Each except entry must be an object.");
    }
    const entry = raw as Record<string, unknown>;
    const trackingReminderId = optionalString(entry.trackingReminderId);
    if (!trackingReminderId) {
      throw new Error("Each except entry needs a trackingReminderId.");
    }
    const status =
      parseEnumInput(NotificationStatus, entry.status, "status") ??
      defaultStatus;
    if (status === undefined) {
      throw new Error(
        `Each except entry needs a status when defaultStatus is omitted. Missing status for ${trackingReminderId}.`,
      );
    }
    assertTrackingReminderResponseStatus(status, "status");
    overrideById.set(trackingReminderId, {
      note: entry.note,
      snoozeMinutes:
        entry.snoozeMinutes === undefined
          ? undefined
          : parseSnoozeMinutes(entry),
      status,
      value: parseOptionalFiniteNumberInput(entry, "value"),
    });
  }

  // Read the whole day, answered rows included, so an exception can correct a
  // response that already exists. The single-reminder tool has always allowed
  // that; rejecting it here made the two tools disagree.
  const due = await listDueTrackingRemindersForUser(
    { dateKey: input.dateKey, includeCompleted: true },
    userId,
  );
  const now = Date.now();
  const scheduledIds = new Set(
    due.notifications.map((item) => item.reminderId),
  );
  const unknownExceptionIds = [...overrideById.keys()].filter(
    (id) => !scheduledIds.has(id),
  );

  if (unknownExceptionIds.length > 0) {
    return {
      answeredCount: 0,
      dateKey: due.dateKey,
      failed: [],
      results: [],
      // Nothing was written, so every scheduled reminder was left untouched.
      skippedCount: due.notifications.length,
      unknownExceptionIds,
    };
  }

  // defaultStatus only reaches notifications that are due and still
  // unanswered. Answering one reminder must never overwrite the rest of the
  // day, and an already-recorded response is not the default's business.
  const isUnanswered = (item: (typeof due.notifications)[number]) =>
    item.status === NotificationStatus.PENDING ||
    item.status === NotificationStatus.SENT ||
    (item.status === NotificationStatus.SNOOZED &&
      item.notifyAt.getTime() <= now);
  const targets = due.notifications.filter((item) => {
    if (overrideById.has(item.reminderId)) return true;
    if (defaultStatus === undefined) return false;
    return item.notifyAt.getTime() <= now && isUnanswered(item);
  });
  const skippedCount = due.notifications.length - targets.length;

  const results: Array<{
    recordedAsZero: boolean;
    reminderId: string;
    source: "default" | "exception";
    status: NotificationStatus;
  }> = [];
  const failed: Array<{ reminderId: string; error: string }> = [];

  for (const item of targets) {
    const override = overrideById.get(item.reminderId);
    const requestedStatus = override?.status ?? defaultStatus;
    if (requestedStatus === undefined) continue;
    const { recordedAsZero, status } =
      resolveTrackingResponseStatus(requestedStatus);
    try {
      await respondToTrackingReminderForUser(
        {
          dateKey: due.dateKey,
          note: override?.note ?? input.note,
          snoozeMinutes: override?.snoozeMinutes ?? globalSnoozeMinutes,
          // Pass the requested status, not the resolved one, so a retired
          // SKIPPED still lands as a zero instead of the reminder's default.
          status: requestedStatus,
          // Anchor the measurement to the scheduled occurrence rather than
          // the wall clock. Answering the same notification twice then
          // upserts one row, so an exception that corrects an earlier batch
          // answer overwrites it instead of leaving a stale duplicate.
          trackedAt: item.notifyAt,
          trackingReminderId: item.reminderId,
          value: override?.value,
        },
        userId,
      );
      results.push({
        recordedAsZero,
        reminderId: item.reminderId,
        source: override ? "exception" : "default",
        status,
      });
    } catch (error) {
      failed.push({
        error: error instanceof Error ? error.message : String(error),
        reminderId: item.reminderId,
      });
    }
  }

  return {
    answeredCount: results.length,
    dateKey: due.dateKey,
    failed,
    results,
    // Reminders scheduled today that this call deliberately left alone.
    skippedCount,
    unknownExceptionIds,
  };
}

export async function respondToTrackingReminderForUser(
  input: Record<string, unknown>,
  userId: string,
) {
  const requestedStatus =
    parseEnumInput(NotificationStatus, input.status, "status") ??
    NotificationStatus.TRACKED;
  assertTrackingReminderResponseStatus(requestedStatus, "status");
  const { recordedAsZero, status } =
    resolveTrackingResponseStatus(requestedStatus);
  const trackingReminderId = optionalString(input.trackingReminderId);
  if (!trackingReminderId) throw new Error("trackingReminderId is required.");
  const snoozeMinutes =
    status === NotificationStatus.SNOOZED ? parseSnoozeMinutes(input) : null;
  const trackedAt = parseOptionalDateValue(input.trackedAt, "trackedAt");
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    select: { timeZone: true },
    where: { id: userId },
  });
  const timeZone = user?.timeZone ?? "UTC";
  const dateKey = parseDateKey(
    input.dateKey,
    getZonedDateKey(trackedAt ?? new Date(), timeZone),
  );
  return prisma.$transaction(async (tx) => {
    const reminder = await tx.trackingReminder.findFirst({
      include: TRACKING_REMINDER_INCLUDE,
      where: {
        deletedAt: null,
        id: trackingReminderId,
        userId,
      },
    });
    if (!reminder) {
      throw new Error(`TrackingReminder not found: ${trackingReminderId}`);
    }
    const explicitValue = parseOptionalFiniteNumberInput(input, "value");
    if (recordedAsZero) {
      assertZeroIsMeasurable(reminder.globalVariable);
    }
    const trackedValue =
      status === NotificationStatus.TRACKED
        ? recordedAsZero
          ? // A retired SKIPPED means not taken, so it is always zero: never
            // the reminder's default dose, and never a value sent alongside
            // it. Anything else would contradict the recordedAsZero result.
            0
          : (explicitValue ?? cleanNumber(reminder.defaultValue))
        : null;
    if (status === NotificationStatus.TRACKED && trackedValue == null) {
      throw new Error(
        "Provide value or configure defaultValue before marking this reminder TRACKED.",
      );
    }
    const notifyAt = reminderNotifyAt(
      dateKey,
      reminder.reminderStartTime,
      timeZone,
    );
    const { end: localDayEnd, start: localDayStart } = dayRange(
      dateKey,
      timeZone,
    );
    const deferUntil =
      snoozeMinutes === null
        ? null
        : new Date(
            Math.min(
              Date.now() + snoozeMinutes * 60_000,
              localDayEnd.getTime() - 1,
            ),
          );
    const notification = await findOrCreateTrackingNotification(tx, {
      deferUntil,
      localDayEnd,
      localDayStart,
      notifyAt,
      status,
      trackedValue,
      trackingReminderId,
      userId,
    });
    let measurement = null;
    if (status === NotificationStatus.TRACKED) {
      const value = trackedValue;
      if (value == null) {
        throw new Error(
          "Provide value or configure defaultValue before marking this reminder TRACKED.",
        );
      }
      const tracked = await recordTrackingMeasurementWithTx(tx, {
        categoryName: reminder.globalVariable.variableCategory.name,
        duration: null,
        fillingType: reminder.nOf1Variable.fillingType,
        globalVariableId: reminder.globalVariableId,
        latitude: null,
        longitude: null,
        note: optionalString(input.note),
        sourceName: optionalString(input.sourceName) ?? "mcp-reminder",
        startTime: trackedAt ?? new Date(),
        unitAbbreviation: optionalString(input.unitAbbreviation),
        unitId:
          optionalString(input.unitId) ?? reminder.globalVariable.defaultUnitId,
        unitName: optionalString(input.unitName),
        userId,
        value,
      });
      measurement = tracked.measurement;
    }
    if (status === NotificationStatus.TRACKED) {
      await tx.trackingReminder.update({
        data: { lastTracked: trackedAt ?? new Date() },
        where: { id: reminder.id },
      });
    }
    return {
      dateKey,
      measurement,
      notification,
      recordedAsZero,
      reminderId: reminder.id,
      ...(recordedAsZero
        ? {
            deprecationNotice:
              "SKIPPED is retired. This response recorded a zero measurement so the not-taken day counts as baseline. Send TRACKED with value 0 instead.",
          }
        : {}),
    };
  });
}

