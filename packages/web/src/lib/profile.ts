import { z } from "zod";

export const HEALTH_VARIABLE_NAME = "Overall Health";
export const HAPPINESS_VARIABLE_NAME = "Happiness";
export const ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME = "Annual Household Income";

const currentYear = new Date().getUTCFullYear();

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }

    return Number(trimmed);
  }

  return value;
}

function nullableString(maxLength: number) {
  return z.preprocess(normalizeOptionalString, z.string().max(maxLength).nullable().optional());
}

function nullableNumber(min?: number, max?: number) {
  return z.preprocess(
    normalizeOptionalNumber,
    z.number()
      .finite()
      .min(min ?? Number.NEGATIVE_INFINITY)
      .max(max ?? Number.POSITIVE_INFINITY)
      .nullable()
      .optional(),
  );
}

function nullableInt(min?: number, max?: number) {
  return z.preprocess(
    normalizeOptionalNumber,
    z.number()
      .int()
      .min(min ?? Number.MIN_SAFE_INTEGER)
      .max(max ?? Number.MAX_SAFE_INTEGER)
      .nullable()
      .optional(),
  );
}

function requireLatLngTogether(
  value: { latitude?: number | null; longitude?: number | null },
  ctx: z.RefinementCtx,
) {
  const hasLatitude = value.latitude != null;
  const hasLongitude = value.longitude != null;
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Latitude and longitude must be provided together.",
      path: hasLatitude ? ["longitude"] : ["latitude"],
    });
  }
}

export const profileSnapshotInputSchema = z
  .object({
    timeZone: nullableString(100),
    countryCode: nullableString(32),
    regionCode: nullableString(64),
    city: nullableString(120),
    postalCode: nullableString(32),
    latitude: nullableNumber(-90, 90),
    longitude: nullableNumber(-180, 180),
    annualHouseholdIncomeUsd: nullableNumber(0, 1_000_000_000),
    householdSize: nullableInt(1, 100),
    birthYear: nullableInt(1900, currentYear),
    educationLevel: nullableString(64),
    employmentStatus: nullableString(64),
    genderIdentity: nullableString(64),
    censusNotes: nullableString(1000),
  })
  .superRefine(requireLatLngTogether);

export const dailyCheckInInputSchema = z.object({
  healthRating: z.coerce.number().int().min(1).max(5),
  happinessRating: z.coerce.number().int().min(1).max(5),
  note: nullableString(500),
  latitude: nullableNumber(-90, 90),
  longitude: nullableNumber(-180, 180),
}).superRefine(requireLatLngTogether);

export type ProfileSnapshotInput = z.infer<typeof profileSnapshotInputSchema>;
export type DailyCheckInInput = z.infer<typeof dailyCheckInInputSchema>;

export interface NumericSummary {
  count: number;
  max: number | null;
  mean: number | null;
  median: number | null;
  min: number | null;
  standardDeviation: number | null;
  uniqueCount: number;
  variance: number | null;
}

export interface CheckInMeasurementRecord {
  globalVariableName: string;
  note?: string | null;
  startTime: Date | string;
  value: number;
}

export interface DailyCheckInHistoryEntry {
  date: string;
  happinessRating: number | null;
  healthRating: number | null;
  note: string | null;
}

export interface ProfileSnapshotData {
  annualHouseholdIncomeUsd: number | null;
  birthYear: number | null;
  censusNotes: string | null;
  censusUpdatedAt: string | null;
  city: string | null;
  countryCode: string | null;
  educationLevel: string | null;
  employmentStatus: string | null;
  genderIdentity: string | null;
  householdSize: number | null;
  lastIncomeReportedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  postalCode: string | null;
  regionCode: string | null;
  timeZone: string | null;
}

export interface CurrentCheckInData {
  date: string;
  happinessRating: number | null;
  healthRating: number | null;
  note: string | null;
}

export interface ProfilePageData {
  currentCheckIn: CurrentCheckInData;
  history: DailyCheckInHistoryEntry[];
  profile: ProfileSnapshotData;
}

export const EDUCATION_LEVEL_OPTIONS = [
  { label: "High school or less", value: "high_school_or_less" },
  { label: "Some college", value: "some_college" },
  { label: "Associate degree", value: "associate_degree" },
  { label: "Bachelor's degree", value: "bachelors_degree" },
  { label: "Graduate degree", value: "graduate_degree" },
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Full-time", value: "employed_full_time" },
  { label: "Part-time", value: "employed_part_time" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Student", value: "student" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
  { label: "Unable to work", value: "unable_to_work" },
] as const;

export function getUtcDayBounds(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { end, start };
}

export function summarizeNumericValues(values: number[]): NumericSummary {
  if (values.length === 0) {
    return {
      count: 0,
      max: null,
      mean: null,
      median: null,
      min: null,
      standardDeviation: null,
      uniqueCount: 0,
      variance: null,
    };
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const count = sortedValues.length;
  const mean = sortedValues.reduce((sum, value) => sum + value, 0) / count;
  const variance =
    sortedValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  const middleIndex = Math.floor(count / 2);
  const median =
    count % 2 === 0
      ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
      : sortedValues[middleIndex];

  return {
    count,
    max: sortedValues[count - 1] ?? null,
    mean,
    median,
    min: sortedValues[0] ?? null,
    standardDeviation: Math.sqrt(variance),
    uniqueCount: new Set(sortedValues).size,
    variance,
  };
}

export function buildDailyCheckInHistory(
  measurements: CheckInMeasurementRecord[],
): DailyCheckInHistoryEntry[] {
  const historyByDate = new Map<string, DailyCheckInHistoryEntry>();

  for (const measurement of measurements) {
    if (
      measurement.globalVariableName !== HEALTH_VARIABLE_NAME &&
      measurement.globalVariableName !== HAPPINESS_VARIABLE_NAME
    ) {
      continue;
    }

    const measurementDate = new Date(measurement.startTime);
    const dateKey = measurementDate.toISOString().slice(0, 10);
    const existing =
      historyByDate.get(dateKey) ?? {
        date: dateKey,
        happinessRating: null,
        healthRating: null,
        note: null,
      };

    if (
      measurement.globalVariableName === HEALTH_VARIABLE_NAME &&
      existing.healthRating === null
    ) {
      existing.healthRating = measurement.value;
    }

    if (
      measurement.globalVariableName === HAPPINESS_VARIABLE_NAME &&
      existing.happinessRating === null
    ) {
      existing.happinessRating = measurement.value;
    }

    if (!existing.note && typeof measurement.note === "string" && measurement.note.trim()) {
      existing.note = measurement.note.trim();
    }

    historyByDate.set(dateKey, existing);
  }

  return Array.from(historyByDate.values()).sort((left, right) =>
    right.date.localeCompare(left.date),
  );
}
