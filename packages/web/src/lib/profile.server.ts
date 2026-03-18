import {
  CombinationOperation,
  FillingType,
  MeasurementScale,
  SubjectType,
  Valence,
  type Prisma,
} from "@optimitron/db";
import {
  ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME,
  HEALTH_VARIABLE_NAME,
  HAPPINESS_VARIABLE_NAME,
  buildDailyCheckInHistory,
  dailyCheckInInputSchema,
  getUtcDayBounds,
  profileSnapshotInputSchema,
  summarizeNumericValues,
  type ProfilePageData,
} from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const CHECK_IN_SOURCE_NAME = "daily-checkin";
const PROFILE_SOURCE_NAME = "profile";
const RATING_UNIT_NAME = "1 to 5 Rating";
const USD_UNIT_NAME = "US Dollars";
const WELLBEING_CATEGORY_NAME = "Wellbeing";

const profileUserSelect = {
  annualHouseholdIncomeUsd: true,
  birthYear: true,
  censusNotes: true,
  censusUpdatedAt: true,
  city: true,
  countryCode: true,
  educationLevel: true,
  email: true,
  employmentStatus: true,
  genderIdentity: true,
  householdSize: true,
  id: true,
  latitude: true,
  longitude: true,
  name: true,
  postalCode: true,
  regionCode: true,
  timeZone: true,
} satisfies Prisma.UserSelect;

type ProfileUser = Prisma.UserGetPayload<{ select: typeof profileUserSelect }>;

interface ProfileCatalog {
  happinessGlobalVariableId: string;
  healthGlobalVariableId: string;
  incomeGlobalVariableId: string;
  ratingUnitId: string;
  usdUnitId: string;
}

interface UpsertMeasurementInput {
  globalVariableId: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  sourceName: string;
  subjectId: string;
  unitId: string;
  userId: string;
  value: number;
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData> {
  const [user, measurements] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: profileUserSelect,
    }),
    prisma.measurement.findMany({
      where: {
        deletedAt: null,
        userId,
        globalVariable: {
          name: {
            in: [
              HEALTH_VARIABLE_NAME,
              HAPPINESS_VARIABLE_NAME,
              ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME,
            ],
          },
        },
      },
      orderBy: [{ startTime: "desc" }],
      select: {
        globalVariable: {
          select: {
            name: true,
          },
        },
        note: true,
        startTime: true,
        value: true,
      },
      take: 60,
    }),
  ]);

  const history = buildDailyCheckInHistory(
    measurements.map((measurement) => ({
      globalVariableName: measurement.globalVariable.name,
      note: measurement.note,
      startTime: measurement.startTime,
      value: measurement.value,
    })),
  ).slice(0, 14);

  const todayKey = getUtcDayBounds(new Date()).start.toISOString().slice(0, 10);
  const todayCheckIn =
    history.find((entry) => entry.date === todayKey) ?? {
      date: todayKey,
      happinessRating: null,
      healthRating: null,
      note: null,
    };
  const latestIncomeMeasurement = measurements.find(
    (measurement) =>
      measurement.globalVariable.name === ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME,
  );

  return {
    currentCheckIn: todayCheckIn,
    history,
    profile: serializeProfileUser(user, latestIncomeMeasurement?.startTime ?? null),
  };
}

export async function saveProfileSnapshot(userId: string, input: unknown) {
  const profile = profileSnapshotInputSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        id: true,
        name: true,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        ...profile,
        censusUpdatedAt: new Date(),
      },
    });

    if (profile.annualHouseholdIncomeUsd !== null && profile.annualHouseholdIncomeUsd !== undefined) {
      const catalog = await ensureProfileCatalog(tx);
      const subject = await ensureSubject(tx, user);

      await upsertDailyMeasurement(tx, {
        globalVariableId: catalog.incomeGlobalVariableId,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        note: "Annual household income snapshot.",
        sourceName: PROFILE_SOURCE_NAME,
        subjectId: subject.id,
        unitId: catalog.usdUnitId,
        userId,
        value: profile.annualHouseholdIncomeUsd,
      });
    }
  });

  return getProfilePageData(userId);
}

export async function saveDailyCheckIn(userId: string, input: unknown) {
  const checkIn = dailyCheckInInputSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        id: true,
        latitude: true,
        longitude: true,
        name: true,
      },
    });
    const catalog = await ensureProfileCatalog(tx);
    const subject = await ensureSubject(tx, user);
    const hasSubmittedCoordinates =
      checkIn.latitude != null && checkIn.longitude != null;
    const coordinates: { latitude: number | null; longitude: number | null } =
      hasSubmittedCoordinates
        ? { latitude: checkIn.latitude ?? null, longitude: checkIn.longitude ?? null }
        : user.latitude !== null && user.longitude !== null
          ? { latitude: user.latitude, longitude: user.longitude }
          : { latitude: null, longitude: null };

    if (hasSubmittedCoordinates) {
      await tx.user.update({
        where: { id: userId },
        data: {
          latitude: checkIn.latitude,
          longitude: checkIn.longitude,
        },
      });
    }

    await upsertDailyMeasurement(tx, {
      globalVariableId: catalog.healthGlobalVariableId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      note: checkIn.note ?? null,
      sourceName: CHECK_IN_SOURCE_NAME,
      subjectId: subject.id,
      unitId: catalog.ratingUnitId,
      userId,
      value: checkIn.healthRating,
    });

    await upsertDailyMeasurement(tx, {
      globalVariableId: catalog.happinessGlobalVariableId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      note: checkIn.note ?? null,
      sourceName: CHECK_IN_SOURCE_NAME,
      subjectId: subject.id,
      unitId: catalog.ratingUnitId,
      userId,
      value: checkIn.happinessRating,
    });
  });

  // Update notification preference with check-in timestamp
  await prisma.userPreference.updateMany({
    where: { userId },
    data: { lastCheckInAt: new Date() },
  });

  return getProfilePageData(userId);
}

function serializeProfileUser(user: ProfileUser, lastIncomeReportedAt: Date | null) {
  return {
    annualHouseholdIncomeUsd: user.annualHouseholdIncomeUsd,
    birthYear: user.birthYear,
    censusNotes: user.censusNotes,
    censusUpdatedAt: user.censusUpdatedAt ? user.censusUpdatedAt.toISOString() : null,
    city: user.city,
    countryCode: user.countryCode,
    educationLevel: user.educationLevel,
    employmentStatus: user.employmentStatus,
    genderIdentity: user.genderIdentity,
    householdSize: user.householdSize,
    lastIncomeReportedAt: lastIncomeReportedAt ? lastIncomeReportedAt.toISOString() : null,
    latitude: user.latitude,
    longitude: user.longitude,
    postalCode: user.postalCode,
    regionCode: user.regionCode,
    timeZone: user.timeZone,
  };
}

async function ensureProfileCatalog(tx: Prisma.TransactionClient): Promise<ProfileCatalog> {
  const ratingUnit = await tx.unit.upsert({
    where: { name: RATING_UNIT_NAME },
    update: {
      abbreviatedName: "1-5",
      fillingType: FillingType.NONE,
      manualTracking: true,
      maximumValue: 5,
      minimumValue: 1,
      scale: MeasurementScale.ORDINAL,
      ucumCode: "{score_5}",
      unitCategoryId: "Rating",
    },
    create: {
      abbreviatedName: "1-5",
      fillingType: FillingType.NONE,
      manualTracking: true,
      maximumValue: 5,
      minimumValue: 1,
      name: RATING_UNIT_NAME,
      scale: MeasurementScale.ORDINAL,
      ucumCode: "{score_5}",
      unitCategoryId: "Rating",
    },
  });
  const usdUnit = await tx.unit.upsert({
    where: { name: USD_UNIT_NAME },
    update: {
      abbreviatedName: "USD",
      fillingType: FillingType.NONE,
      manualTracking: true,
      scale: MeasurementScale.RATIO,
      ucumCode: "[USD]",
      unitCategoryId: "Currency",
    },
    create: {
      abbreviatedName: "USD",
      fillingType: FillingType.NONE,
      manualTracking: true,
      name: USD_UNIT_NAME,
      scale: MeasurementScale.RATIO,
      ucumCode: "[USD]",
      unitCategoryId: "Currency",
    },
  });

  const [emotionCategory, economicCategory, wellbeingCategory] = await Promise.all([
    tx.variableCategory.upsert({
      where: { name: "Emotion" },
      update: { defaultUnitId: ratingUnit.id },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: ratingUnit.id,
        description: "Emotional states, mood, and subjective well-being",
        durationOfAction: 86400,
        name: "Emotion",
        onsetDelay: 0,
        outcome: true,
        predictorOnly: false,
      },
    }),
    tx.variableCategory.upsert({
      where: { name: "Economic" },
      update: { defaultUnitId: usdUnit.id },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: usdUnit.id,
        description: "Economic indicators and financial metrics",
        durationOfAction: 2_592_000,
        name: "Economic",
        onsetDelay: 0,
        outcome: true,
        predictorOnly: false,
      },
    }),
    tx.variableCategory.upsert({
      where: { name: WELLBEING_CATEGORY_NAME },
      update: { defaultUnitId: ratingUnit.id },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: ratingUnit.id,
        description: "Self-reported wellbeing and quality-of-life ratings",
        durationOfAction: 86400,
        name: WELLBEING_CATEGORY_NAME,
        onsetDelay: 0,
        outcome: true,
        predictorOnly: false,
      },
    }),
  ]);

  const [healthVariable, happinessVariable, incomeVariable] = await Promise.all([
    tx.globalVariable.upsert({
      where: { name: HEALTH_VARIABLE_NAME },
      update: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: ratingUnit.id,
        description: "Daily self-rating of overall health on a 1 to 5 scale.",
        fillingType: FillingType.NONE,
        maximumAllowedValue: 5,
        minimumAllowedValue: 1,
        outcome: true,
        predictorOnly: false,
        valence: Valence.POSITIVE,
        variableCategoryId: wellbeingCategory.id,
      },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: ratingUnit.id,
        description: "Daily self-rating of overall health on a 1 to 5 scale.",
        fillingType: FillingType.NONE,
        maximumAllowedValue: 5,
        minimumAllowedValue: 1,
        name: HEALTH_VARIABLE_NAME,
        outcome: true,
        predictorOnly: false,
        valence: Valence.POSITIVE,
        variableCategoryId: wellbeingCategory.id,
      },
    }),
    tx.globalVariable.upsert({
      where: { name: HAPPINESS_VARIABLE_NAME },
      update: {
        defaultUnitId: ratingUnit.id,
        variableCategoryId: emotionCategory.id,
      },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: ratingUnit.id,
        description: "Daily happiness rating on a 1 to 5 scale.",
        fillingType: FillingType.NONE,
        maximumAllowedValue: 5,
        minimumAllowedValue: 1,
        name: HAPPINESS_VARIABLE_NAME,
        outcome: true,
        predictorOnly: false,
        valence: Valence.POSITIVE,
        variableCategoryId: emotionCategory.id,
      },
    }),
    tx.globalVariable.upsert({
      where: { name: ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME },
      update: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: usdUnit.id,
        description: "Self-reported annual household income in USD.",
        fillingType: FillingType.NONE,
        minimumAllowedValue: 0,
        outcome: true,
        predictorOnly: false,
        valence: Valence.POSITIVE,
        variableCategoryId: economicCategory.id,
      },
      create: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: usdUnit.id,
        description: "Self-reported annual household income in USD.",
        fillingType: FillingType.NONE,
        minimumAllowedValue: 0,
        name: ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME,
        outcome: true,
        predictorOnly: false,
        valence: Valence.POSITIVE,
        variableCategoryId: economicCategory.id,
      },
    }),
  ]);

  return {
    happinessGlobalVariableId: happinessVariable.id,
    healthGlobalVariableId: healthVariable.id,
    incomeGlobalVariableId: incomeVariable.id,
    ratingUnitId: ratingUnit.id,
    usdUnitId: usdUnit.id,
  };
}

async function ensureSubject(
  tx: Prisma.TransactionClient,
  user: { email: string | null; id: string; name: string | null },
) {
  return tx.subject.upsert({
    where: { externalId: user.id },
    update: {
      displayName: user.name ?? user.email ?? "Optimitron User",
      subjectType: SubjectType.USER,
    },
    create: {
      displayName: user.name ?? user.email ?? "Optimitron User",
      externalId: user.id,
      subjectType: SubjectType.USER,
    },
  });
}

async function upsertDailyMeasurement(
  tx: Prisma.TransactionClient,
  input: UpsertMeasurementInput,
) {
  const nOf1Variable = await tx.nOf1Variable.upsert({
    where: {
      userId_globalVariableId: {
        globalVariableId: input.globalVariableId,
        userId: input.userId,
      },
    },
    update: {
      defaultUnitId: input.unitId,
      subjectId: input.subjectId,
    },
    create: {
      defaultUnitId: input.unitId,
      globalVariableId: input.globalVariableId,
      subjectId: input.subjectId,
      userId: input.userId,
    },
  });
  const { end, start } = getUtcDayBounds(new Date());
  const existingMeasurement = await tx.measurement.findFirst({
    where: {
      deletedAt: null,
      globalVariableId: input.globalVariableId,
      startTime: {
        gte: start,
        lt: end,
      },
      userId: input.userId,
    },
    orderBy: [{ startTime: "desc" }],
    select: { id: true },
  });

  if (existingMeasurement) {
    await tx.measurement.update({
      where: { id: existingMeasurement.id },
      data: {
        latitude: input.latitude,
        longitude: input.longitude,
        note: input.note,
        originalUnitId: input.unitId,
        originalValue: input.value,
        sourceName: input.sourceName,
        unitId: input.unitId,
        value: input.value,
      },
    });
  } else {
    await tx.measurement.create({
      data: {
        globalVariableId: input.globalVariableId,
        latitude: input.latitude,
        longitude: input.longitude,
        nOf1VariableId: nOf1Variable.id,
        note: input.note,
        originalUnitId: input.unitId,
        originalValue: input.value,
        sourceName: input.sourceName,
        startTime: new Date(),
        unitId: input.unitId,
        userId: input.userId,
        value: input.value,
      },
    });
  }

  await refreshMeasurementSummaries(tx, nOf1Variable.id, input.globalVariableId);
}

async function refreshMeasurementSummaries(
  tx: Prisma.TransactionClient,
  nOf1VariableId: string,
  globalVariableId: string,
) {
  const [globalMeasurements, nOf1Measurements, nOf1VariableCount] = await Promise.all([
    tx.measurement.findMany({
      where: {
        deletedAt: null,
        globalVariableId,
      },
      orderBy: [{ startTime: "asc" }],
      select: {
        startTime: true,
        value: true,
      },
    }),
    tx.measurement.findMany({
      where: {
        deletedAt: null,
        nOf1VariableId,
      },
      orderBy: [{ startTime: "asc" }],
      select: {
        startTime: true,
        value: true,
      },
    }),
    tx.nOf1Variable.count({
      where: {
        deletedAt: null,
        globalVariableId,
      },
    }),
  ]);
  const globalSummary = summarizeNumericValues(
    globalMeasurements.map((measurement) => measurement.value),
  );
  const nOf1Summary = summarizeNumericValues(
    nOf1Measurements.map((measurement) => measurement.value),
  );

  await Promise.all([
    tx.globalVariable.update({
      where: { id: globalVariableId },
      data: {
        earliestMeasurementStartAt: globalMeasurements[0]?.startTime ?? null,
        latestMeasurementStartAt:
          globalMeasurements[globalMeasurements.length - 1]?.startTime ?? null,
        maximumRecordedValue: globalSummary.max,
        mean: globalSummary.mean,
        median: globalSummary.median,
        minimumRecordedValue: globalSummary.min,
        numberOfMeasurements: globalSummary.count,
        numberOfNOf1Variables: nOf1VariableCount,
        numberOfUniqueValues: globalSummary.uniqueCount,
        standardDeviation: globalSummary.standardDeviation,
        variance: globalSummary.variance,
      },
    }),
    tx.nOf1Variable.update({
      where: { id: nOf1VariableId },
      data: {
        earliestMeasurementStartAt: nOf1Measurements[0]?.startTime ?? null,
        latestMeasurementStartAt:
          nOf1Measurements[nOf1Measurements.length - 1]?.startTime ?? null,
        maximumRecordedValue: nOf1Summary.max,
        mean: nOf1Summary.mean,
        median: nOf1Summary.median,
        minimumRecordedValue: nOf1Summary.min,
        numberOfMeasurements: nOf1Summary.count,
        standardDeviation: nOf1Summary.standardDeviation,
        variance: nOf1Summary.variance,
      },
    }),
  ]);
}
