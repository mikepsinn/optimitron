import { z } from "zod";

export const HEALTH_VARIABLE_NAME = "Overall Health";
export const HAPPINESS_VARIABLE_NAME = "Happiness";
export const ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME = "Annual Household Income";
export const ANNUAL_PERSONAL_INCOME_VARIABLE_NAME = "Annual Personal Income";

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

function normalizeStringArray(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}

function stringArray(maxItems = 32, maxLength = 64) {
  return z.preprocess(
    normalizeStringArray,
    z.array(z.string().max(maxLength)).max(maxItems).default([]),
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
    // Location
    timeZone: nullableString(100),
    countryCode: nullableString(32),
    regionCode: nullableString(64),
    city: nullableString(120),
    postalCode: nullableString(32),
    latitude: nullableNumber(-90, 90),
    longitude: nullableNumber(-180, 180),
    // Income & economic
    annualPersonalIncomeUsd: nullableNumber(0, 1_000_000_000),
    annualHouseholdIncomeUsd: nullableNumber(0, 1_000_000_000),
    annualTaxesPaidUsd: nullableNumber(0, 1_000_000_000),
    monthlyHousingCostUsd: nullableNumber(0, 1_000_000),
    householdSize: nullableInt(1, 100),
    housingStatus: nullableString(32),
    hoursWorkedPerWeek: nullableInt(0, 168),
    industryOrSector: nullableString(120),
    // Demographics
    birthYear: nullableInt(1900, currentYear),
    biologicalSex: nullableString(32),
    ethnicityOrRace: nullableString(120),
    maritalStatus: nullableString(32),
    numberOfDependents: nullableInt(0, 100),
    primaryLanguage: nullableString(32),
    educationLevel: nullableString(64),
    employmentStatus: nullableString(64),
    genderIdentity: nullableString(64),
    citizenshipStatus: nullableString(32),
    // Health / HALE
    healthInsuranceType: nullableString(32),
    chronicConditionCount: nullableInt(0, 3),
    disabilityStatus: nullableString(32),
    smokingStatus: nullableString(32),
    alcoholFrequency: nullableString(32),
    heightCm: nullableNumber(30, 300),
    // Access
    internetAccessType: nullableString(32),
    // Skills & tasks
    skillTags: stringArray(32, 64),
    interestTags: stringArray(32, 64),
    availableHoursPerWeek: nullableInt(0, 168),
    // Notes
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
  personId: string | null;
  // Location
  timeZone: string | null;
  countryCode: string | null;
  regionCode: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  // Income & economic
  annualPersonalIncomeUsd: number | null;
  annualHouseholdIncomeUsd: number | null;
  annualTaxesPaidUsd: number | null;
  monthlyHousingCostUsd: number | null;
  householdSize: number | null;
  housingStatus: string | null;
  hoursWorkedPerWeek: number | null;
  industryOrSector: string | null;
  // Demographics
  birthYear: number | null;
  biologicalSex: string | null;
  ethnicityOrRace: string | null;
  maritalStatus: string | null;
  numberOfDependents: number | null;
  primaryLanguage: string | null;
  educationLevel: string | null;
  employmentStatus: string | null;
  genderIdentity: string | null;
  citizenshipStatus: string | null;
  // Health / HALE
  healthInsuranceType: string | null;
  chronicConditionCount: number | null;
  disabilityStatus: string | null;
  smokingStatus: string | null;
  alcoholFrequency: string | null;
  heightCm: number | null;
  // Access
  internetAccessType: string | null;
  // Skills & tasks
  skillTags: string[];
  interestTags: string[];
  availableHoursPerWeek: number | null;
  // Notes
  censusNotes: string | null;
  // Metadata
  censusUpdatedAt: string | null;
  lastIncomeReportedAt: string | null;
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

export interface CheckInPageData {
  currentCheckIn: CurrentCheckInData;
  history: DailyCheckInHistoryEntry[];
  userLocation: { latitude: number | null; longitude: number | null };
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

export const BIOLOGICAL_SEX_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Intersex", value: "intersex" },
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Domestic partnership", value: "domestic_partnership" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
  { label: "Separated", value: "separated" },
] as const;

export const HEALTH_INSURANCE_OPTIONS = [
  { label: "Employer-provided", value: "employer" },
  { label: "Marketplace / private", value: "marketplace" },
  { label: "Government (Medicare, Medicaid, NHS, etc.)", value: "government" },
  { label: "Military (VA, Tricare, etc.)", value: "military" },
  { label: "None", value: "none" },
  { label: "Other", value: "other" },
] as const;

export const DISABILITY_STATUS_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Physical", value: "physical" },
  { label: "Cognitive", value: "cognitive" },
  { label: "Sensory (vision, hearing)", value: "sensory" },
  { label: "Multiple", value: "multiple" },
] as const;

export const SMOKING_STATUS_OPTIONS = [
  { label: "Never smoked", value: "never" },
  { label: "Former smoker", value: "former" },
  { label: "Current smoker", value: "current" },
] as const;

export const ALCOHOL_FREQUENCY_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "Monthly or less", value: "monthly_or_less" },
  { label: "Weekly", value: "weekly" },
  { label: "Daily", value: "daily" },
] as const;

export const HOUSING_STATUS_OPTIONS = [
  { label: "Own", value: "own" },
  { label: "Rent", value: "rent" },
  { label: "Other arrangement", value: "other" },
  { label: "Homeless / unhoused", value: "homeless" },
] as const;

export const CITIZENSHIP_STATUS_OPTIONS = [
  { label: "Citizen", value: "citizen" },
  { label: "Permanent resident", value: "permanent_resident" },
  { label: "Visa holder", value: "visa_holder" },
  { label: "Undocumented", value: "undocumented" },
  { label: "Other", value: "other" },
] as const;

export const INTERNET_ACCESS_OPTIONS = [
  { label: "Broadband (home internet)", value: "broadband" },
  { label: "Mobile only", value: "mobile_only" },
  { label: "No internet access", value: "none" },
] as const;

export const CHRONIC_CONDITION_OPTIONS = [
  { label: "None", value: "0" },
  { label: "1 condition", value: "1" },
  { label: "2 conditions", value: "2" },
  { label: "3 or more", value: "3" },
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
