import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  personServer: {
    ensurePersonForUser: vi.fn(),
  },
  prisma: {
    measurementFindMany: vi.fn(),
    userPreferenceUpdateMany: vi.fn(),
    transaction: vi.fn(),
    userFindUniqueOrThrow: vi.fn(),
    userUpdate: vi.fn(),
  },
  tx: {
    globalVariableUpdate: vi.fn(),
    globalVariableUpsert: vi.fn(),
    measurementCreate: vi.fn(),
    measurementFindFirst: vi.fn(),
    measurementFindMany: vi.fn(),
    measurementUpdate: vi.fn(),
    nOf1VariableCount: vi.fn(),
    queryRaw: vi.fn(),
    nOf1VariableUpdate: vi.fn(),
    nOf1VariableUpsert: vi.fn(),
    personFindFirst: vi.fn(),
    personFindUnique: vi.fn(),
    subjectUpsert: vi.fn(),
    unitUpsert: vi.fn(),
    userFindUniqueOrThrow: vi.fn(),
    userUpdate: vi.fn(),
    variableCategoryUpsert: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.prisma.transaction,
    measurement: {
      findMany: mocks.prisma.measurementFindMany,
    },
    userPreference: {
      updateMany: mocks.prisma.userPreferenceUpdateMany,
    },
    user: {
      findUnique: mocks.prisma.userFindUniqueOrThrow,
      findUniqueOrThrow: mocks.prisma.userFindUniqueOrThrow,
      update: mocks.prisma.userUpdate,
    },
  },
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.personServer.ensurePersonForUser,
}));

import {
  getProfilePageData,
  saveDailyCheckIn,
  saveProfileSnapshot,
} from "../profile.server";

/** Default null values for all 18 new census fields — spread into mock user objects */
const NULL_NEW_CENSUS_FIELDS = {
  availableHoursPerWeek: null,
  annualTaxesPaidUsd: null,
  monthlyHousingCostUsd: null,
  housingStatus: null,
  hoursWorkedPerWeek: null,
  industryOrSector: null,
  biologicalSex: null,
  ethnicityOrRace: null,
  maritalStatus: null,
  numberOfDependents: null,
  primaryLanguage: null,
  citizenshipStatus: null,
  healthInsuranceType: null,
  chronicConditionCount: null,
  disabilityStatus: null,
  smokingStatus: null,
  alcoholFrequency: null,
  heightCm: null,
  internetAccessType: null,
  interestTags: [],
  personId: null,
  skillTags: [],
};

function createTransactionClient() {
  return {
    $queryRaw: mocks.tx.queryRaw,
    globalVariable: {
      update: mocks.tx.globalVariableUpdate,
      upsert: mocks.tx.globalVariableUpsert,
    },
    measurement: {
      create: mocks.tx.measurementCreate,
      findFirst: mocks.tx.measurementFindFirst,
      findMany: mocks.tx.measurementFindMany,
      update: mocks.tx.measurementUpdate,
    },
    nOf1Variable: {
      count: mocks.tx.nOf1VariableCount,
      update: mocks.tx.nOf1VariableUpdate,
      upsert: mocks.tx.nOf1VariableUpsert,
    },
    person: {
      findFirst: mocks.tx.personFindFirst,
      findUnique: mocks.tx.personFindUnique,
    },
    subject: {
      upsert: mocks.tx.subjectUpsert,
    },
    unit: {
      upsert: mocks.tx.unitUpsert,
    },
    user: {
      findUniqueOrThrow: mocks.tx.userFindUniqueOrThrow,
      update: mocks.tx.userUpdate,
    },
    variableCategory: {
      upsert: mocks.tx.variableCategoryUpsert,
    },
  };
}

function resetAllMocks() {
  for (const group of Object.values(mocks)) {
    for (const mockFn of Object.values(group)) {
      mockFn.mockReset();
    }
  }
}

function mockCatalogDefaults() {
  mocks.tx.unitUpsert.mockImplementation(async ({ where }: { where: { name: string } }) => ({
    id: where.name === "US Dollars" ? "unit_usd" : "unit_rating",
  }));
  mocks.tx.variableCategoryUpsert.mockImplementation(
    async ({ where }: { where: { name: string } }) => ({
      id: `category_${where.name.toLowerCase()}`,
    }),
  );
  mocks.tx.globalVariableUpsert.mockImplementation(
    async ({ where }: { where: { name: string } }) => ({
      id:
        where.name === "Overall Health"
          ? "gv_health"
          : where.name === "Happiness"
            ? "gv_happiness"
            : "gv_income",
    }),
  );
  mocks.tx.subjectUpsert.mockResolvedValue({ id: "subject_1" });
  mocks.tx.nOf1VariableUpsert.mockResolvedValue({ id: "n1_1" });
  mocks.tx.nOf1VariableCount.mockResolvedValue(1);
  mocks.personServer.ensurePersonForUser.mockResolvedValue({ id: "person_1" });
  mocks.tx.personFindFirst.mockResolvedValue(null);
  mocks.tx.personFindUnique.mockResolvedValue({
    displayName: "Jane",
    id: "person_1",
  });
  mocks.tx.measurementFindMany.mockResolvedValue([
    { startTime: new Date("2026-03-12T10:00:00.000Z"), value: 4 },
  ]);
  // refreshMeasurementSummaries aggregates in Postgres; one row per scope.
  mocks.tx.queryRaw.mockResolvedValue([
    {
      count: 1,
      earliestStartTime: new Date("2026-03-12T10:00:00.000Z"),
      latestStartTime: new Date("2026-03-12T10:00:00.000Z"),
      maximumRecordedValue: 4,
      mean: 4,
      median: 4,
      minimumRecordedValue: 4,
      standardDeviation: 0,
      uniqueCount: 1,
      variance: 0,
    },
  ]);
  mocks.tx.globalVariableUpdate.mockResolvedValue(undefined);
  mocks.tx.nOf1VariableUpdate.mockResolvedValue(undefined);
  mocks.tx.userUpdate.mockResolvedValue(undefined);
  mocks.tx.measurementCreate.mockResolvedValue(undefined);
  mocks.tx.measurementUpdate.mockResolvedValue(undefined);
  mocks.prisma.userPreferenceUpdateMany.mockResolvedValue({ count: 0 });
}

function mockProfilePageLoad({
  measurements,
  user,
}: {
  measurements: Array<{
    globalVariable: { name: string };
    note: string | null;
    startTime: Date;
    value: number;
  }>;
  user: Record<string, unknown>;
}) {
  mocks.prisma.userFindUniqueOrThrow.mockResolvedValue(user);
  mocks.prisma.measurementFindMany.mockResolvedValue(measurements);
}

describe("profile server", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));
    resetAllMocks();
    mockCatalogDefaults();
    mocks.prisma.transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback(createTransactionClient()),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds profile page data from user and measurement history", async () => {
    mockProfilePageLoad({
      user: {
        ...NULL_NEW_CENSUS_FIELDS,
        annualPersonalIncomeUsd: null,
        annualHouseholdIncomeUsd: 92_000,
        birthYear: 1990,
        censusNotes: "Household of three.",
        censusUpdatedAt: new Date("2026-03-10T00:00:00.000Z"),
        city: "Chicago",
        countryCode: "US",
        educationLevel: "bachelors_degree",
        email: "jane@example.com",
        employmentStatus: "employed_full_time",
        genderIdentity: "woman",
        householdSize: 3,
        id: "user_1",
        latitude: 41.8781,
        longitude: -87.6298,
        name: "Jane",
        postalCode: "60601",
        regionCode: "IL",
        timeZone: "America/Chicago",
      },
      measurements: [
        {
          globalVariable: { name: "Overall Health" },
          note: "Felt solid",
          startTime: new Date("2026-03-12T09:00:00.000Z"),
          value: 4,
        },
        {
          globalVariable: { name: "Happiness" },
          note: null,
          startTime: new Date("2026-03-12T09:05:00.000Z"),
          value: 5,
        },
        {
          globalVariable: { name: "Annual Household Income" },
          note: "Income snapshot",
          startTime: new Date("2026-03-11T00:00:00.000Z"),
          value: 92_000,
        },
        {
          globalVariable: { name: "Overall Health" },
          note: null,
          startTime: new Date("2026-03-11T09:00:00.000Z"),
          value: 3,
        },
      ],
    });

    await expect(getProfilePageData("user_1")).resolves.toEqual({
      currentCheckIn: {
        date: "2026-03-12",
        happinessRating: 5,
        healthRating: 4,
        note: "Felt solid",
      },
      history: [
        {
          date: "2026-03-12",
          happinessRating: 5,
          healthRating: 4,
          note: "Felt solid",
        },
        {
          date: "2026-03-11",
          happinessRating: null,
          healthRating: 3,
          note: null,
        },
      ],
      profile: {
        ...NULL_NEW_CENSUS_FIELDS,
        annualPersonalIncomeUsd: null,
        annualHouseholdIncomeUsd: 92_000,
        birthYear: 1990,
        censusNotes: "Household of three.",
        censusUpdatedAt: "2026-03-10T00:00:00.000Z",
        city: "Chicago",
        countryCode: "US",
        educationLevel: "bachelors_degree",
        employmentStatus: "employed_full_time",
        genderIdentity: "woman",
        householdSize: 3,
        lastIncomeReportedAt: "2026-03-11T00:00:00.000Z",
        latitude: 41.8781,
        longitude: -87.6298,
        postalCode: "60601",
        regionCode: "IL",
        timeZone: "America/Chicago",
      },
    });
  });

  it("saves a census snapshot and records income as a measurement", async () => {
    mocks.tx.userFindUniqueOrThrow.mockResolvedValue({
      email: "jane@example.com",
      id: "user_1",
      name: "Jane",
    });
    mocks.tx.measurementFindFirst.mockResolvedValue(null);
    mockProfilePageLoad({
      user: {
        ...NULL_NEW_CENSUS_FIELDS,
        annualPersonalIncomeUsd: null,
        annualHouseholdIncomeUsd: 120_000,
        birthYear: null,
        censusNotes: null,
        censusUpdatedAt: new Date("2026-03-12T10:00:00.000Z"),
        city: "Chicago",
        countryCode: null,
        educationLevel: null,
        email: "jane@example.com",
        employmentStatus: null,
        genderIdentity: null,
        householdSize: null,
        id: "user_1",
        latitude: 41.8781,
        longitude: -87.6298,
        name: "Jane",
        postalCode: null,
        regionCode: null,
        timeZone: null,
      },
      measurements: [
        {
          globalVariable: { name: "Annual Household Income" },
          note: "Annual household income snapshot.",
          startTime: new Date("2026-03-12T10:00:00.000Z"),
          value: 120_000,
        },
      ],
    });

    const result = await saveProfileSnapshot("user_1", {
      annualHouseholdIncomeUsd: "120000",
      city: "Chicago",
      latitude: "41.8781",
      longitude: "-87.6298",
    });

    expect(mocks.tx.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: expect.objectContaining({
        annualHouseholdIncomeUsd: 120_000,
        censusUpdatedAt: expect.any(Date),
        city: "Chicago",
        latitude: 41.8781,
        longitude: -87.6298,
      }),
    });
    expect(mocks.tx.measurementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        globalVariableId: "gv_income",
        note: "Annual household income snapshot.",
        originalUnitId: "unit_usd",
        originalValue: 120_000,
        recordedByUserId: "user_1",
        sourceName: "profile",
        startTime: expect.any(Date),
        subjectId: "subject_1",
        unitId: "unit_usd",
        value: 120_000,
      }),
    });
    expect(mocks.tx.measurementCreate.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "userId",
    );
    expect(mocks.tx.nOf1VariableUpsert.mock.calls[0]?.[0]?.create).not.toHaveProperty(
      "userId",
    );
    expect(mocks.tx.nOf1VariableUpsert.mock.calls[0]?.[0]?.update).not.toHaveProperty(
      "userId",
    );
    expect(result!.profile.annualHouseholdIncomeUsd).toBe(120_000);
    expect(result!.profile.lastIncomeReportedAt).toBe("2026-03-12T10:00:00.000Z");
  });

  it("updates same-day health and happiness measurements instead of duplicating them", async () => {
    mocks.tx.userFindUniqueOrThrow.mockResolvedValue({
      email: "jane@example.com",
      id: "user_1",
      latitude: 40.0,
      longitude: -90.0,
      name: "Jane",
    });
    mocks.tx.measurementFindFirst
      .mockResolvedValueOnce({ id: "measurement_health" })
      .mockResolvedValueOnce({ id: "measurement_happiness" });
    mockProfilePageLoad({
      user: {
        ...NULL_NEW_CENSUS_FIELDS,
        annualPersonalIncomeUsd: null,
        annualHouseholdIncomeUsd: null,
        birthYear: null,
        censusNotes: null,
        censusUpdatedAt: null,
        city: null,
        countryCode: null,
        educationLevel: null,
        email: "jane@example.com",
        employmentStatus: null,
        genderIdentity: null,
        householdSize: null,
        id: "user_1",
        latitude: 41.0,
        longitude: -87.0,
        name: "Jane",
        postalCode: null,
        regionCode: null,
        timeZone: null,
      },
      measurements: [
        {
          globalVariable: { name: "Overall Health" },
          note: "Better today",
          startTime: new Date("2026-03-12T10:00:00.000Z"),
          value: 4,
        },
        {
          globalVariable: { name: "Happiness" },
          note: "Better today",
          startTime: new Date("2026-03-12T10:00:00.000Z"),
          value: 5,
        },
      ],
    });

    const result = await saveDailyCheckIn("user_1", {
      happinessRating: 5,
      healthRating: 4,
      latitude: 41,
      longitude: -87,
      note: "Better today",
    });

    expect(mocks.tx.userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        latitude: 41,
        longitude: -87,
      },
    });
    expect(mocks.tx.measurementCreate).not.toHaveBeenCalled();
    expect(mocks.tx.measurementUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.tx.measurementUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "measurement_health" },
      data: expect.objectContaining({
        latitude: 41,
        longitude: -87,
        note: "Better today",
        recordedByUserId: "user_1",
        sourceName: "daily-checkin",
        subjectId: "subject_1",
        value: 4,
      }),
    });
    expect(mocks.tx.measurementUpdate.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      "userId",
    );
    expect(mocks.tx.measurementUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "measurement_happiness" },
      data: expect.objectContaining({
        latitude: 41,
        longitude: -87,
        note: "Better today",
        recordedByUserId: "user_1",
        sourceName: "daily-checkin",
        subjectId: "subject_1",
        value: 5,
      }),
    });
    expect(mocks.tx.measurementUpdate.mock.calls[1]?.[0]?.data).not.toHaveProperty(
      "userId",
    );
    expect(result!.currentCheckIn).toEqual({
      date: "2026-03-12",
      happinessRating: 5,
      healthRating: 4,
      note: "Better today",
    });
  });
});
