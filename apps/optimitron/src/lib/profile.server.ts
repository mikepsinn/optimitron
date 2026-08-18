import {
  CombinationOperation,
  FillingType,
  MeasurementScale,
  Valence,
  type Prisma,
} from "@optimitron/db";
import { refreshMeasurementSummaries } from "@/lib/measurement-summaries.server";
import { ensurePersonForUser } from "@/lib/person.server";
import { ensureSubjectForUser } from "@/lib/subject.server";
import {
  ANNUAL_HOUSEHOLD_INCOME_VARIABLE_NAME,
  ANNUAL_PERSONAL_INCOME_VARIABLE_NAME,
  HEALTH_VARIABLE_NAME,
  HAPPINESS_VARIABLE_NAME,
  buildDailyCheckInHistory,
  dailyCheckInInputSchema,
  getUtcDayBounds,
  profileSnapshotInputSchema,
  type CheckInPageData,
  type ProfilePageData,
} from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const CHECK_IN_SOURCE_NAME = "daily-checkin";
const PROFILE_SOURCE_NAME = "profile";
const RATING_UNIT_NAME = "1 to 5 Rating";
const USD_UNIT_NAME = "US Dollars";
const WELLBEING_CATEGORY_NAME = "Wellbeing";

const profileUserSelect = {
  personId: true,
  // Location
  timeZone: true,
  countryCode: true,
  regionCode: true,
  city: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  // Income & economic
  annualPersonalIncomeUsd: true,
  annualHouseholdIncomeUsd: true,
  annualTaxesPaidUsd: true,
  monthlyHousingCostUsd: true,
  householdSize: true,
  housingStatus: true,
  hoursWorkedPerWeek: true,
  industryOrSector: true,
  // Demographics
  birthYear: true,
  biologicalSex: true,
  ethnicityOrRace: true,
  maritalStatus: true,
  numberOfDependents: true,
  primaryLanguage: true,
  educationLevel: true,
  employmentStatus: true,
  genderIdentity: true,
  citizenshipStatus: true,
  // Health / HALE
  healthInsuranceType: true,
  chronicConditionCount: true,
  disabilityStatus: true,
  smokingStatus: true,
  alcoholFrequency: true,
  heightCm: true,
  // Access
  internetAccessType: true,
  // Skills & tasks
  skillTags: true,
  interestTags: true,
  availableHoursPerWeek: true,
  // Notes & meta
  censusNotes: true,
  censusUpdatedAt: true,
  // Identity (needed for display/subjects)
  id: true,
  email: true,
} satisfies Prisma.UserSelect;

type ProfileUser = Prisma.UserGetPayload<{ select: typeof profileUserSelect }>;

interface ProfileCatalog {
  happinessGlobalVariableId: string;
  healthGlobalVariableId: string;
  incomeGlobalVariableId: string;
  personalIncomeGlobalVariableId: string;
  ratingUnitId: string;
  usdUnitId: string;
}

interface UpsertMeasurementInput {
  globalVariableId: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  recordedByUserId: string;
  sourceName: string;
  subjectId: string;
  unitId: string;
  value: number;
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData | null> {
  const [user, measurements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: profileUserSelect,
    }),
    prisma.measurement.findMany({
      where: {
        deletedAt: null,
        subject: { userId },
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

  if (!user) {
    return null;
  }

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

export async function getCheckInPageData(userId: string): Promise<CheckInPageData | null> {
  const [user, measurements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    }),
    prisma.measurement.findMany({
      where: {
        deletedAt: null,
        subject: { userId },
        globalVariable: {
          name: { in: [HEALTH_VARIABLE_NAME, HAPPINESS_VARIABLE_NAME] },
        },
      },
      orderBy: [{ startTime: "desc" }],
      select: {
        globalVariable: { select: { name: true } },
        note: true,
        startTime: true,
        value: true,
      },
      take: 40,
    }),
  ]);

  if (!user) return null;

  const history = buildDailyCheckInHistory(
    measurements.map((m) => ({
      globalVariableName: m.globalVariable.name,
      note: m.note,
      startTime: m.startTime,
      value: m.value,
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

  return {
    currentCheckIn: todayCheckIn,
    history,
    userLocation: { latitude: user.latitude, longitude: user.longitude },
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
        personId: true,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        ...profile,
        censusUpdatedAt: new Date(),
      },
    });

    const person = await ensurePersonForUser(userId, undefined, tx);

    const hasHouseholdIncome = profile.annualHouseholdIncomeUsd !== null && profile.annualHouseholdIncomeUsd !== undefined;
    const hasPersonalIncome = profile.annualPersonalIncomeUsd !== null && profile.annualPersonalIncomeUsd !== undefined;

    if (hasHouseholdIncome || hasPersonalIncome) {
      const catalog = await ensureProfileCatalog(tx);
      const subject = await ensureSubjectForUser(tx, {
        ...user,
        personId: person.id,
      });

      if (hasHouseholdIncome) {
        await upsertDailyMeasurement(tx, {
          globalVariableId: catalog.incomeGlobalVariableId,
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
          note: "Annual household income snapshot.",
          recordedByUserId: userId,
          sourceName: PROFILE_SOURCE_NAME,
          subjectId: subject.id,
          unitId: catalog.usdUnitId,
          value: profile.annualHouseholdIncomeUsd!,
        });
      }

      if (hasPersonalIncome) {
        await upsertDailyMeasurement(tx, {
          globalVariableId: catalog.personalIncomeGlobalVariableId,
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
          note: "Annual personal income snapshot.",
          recordedByUserId: userId,
          sourceName: PROFILE_SOURCE_NAME,
          subjectId: subject.id,
          unitId: catalog.usdUnitId,
          value: profile.annualPersonalIncomeUsd!,
        });
      }
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
        personId: true,
      },
    });
    const catalog = await ensureProfileCatalog(tx);
    const person = await ensurePersonForUser(userId, undefined, tx);
    const subject = await ensureSubjectForUser(tx, {
      ...user,
      personId: person.id,
    });
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
      recordedByUserId: userId,
      sourceName: CHECK_IN_SOURCE_NAME,
      subjectId: subject.id,
      unitId: catalog.ratingUnitId,
      value: checkIn.healthRating,
    });

    await upsertDailyMeasurement(tx, {
      globalVariableId: catalog.happinessGlobalVariableId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      note: checkIn.note ?? null,
      recordedByUserId: userId,
      sourceName: CHECK_IN_SOURCE_NAME,
      subjectId: subject.id,
      unitId: catalog.ratingUnitId,
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
    personId: user.personId,
    // Location
    timeZone: user.timeZone,
    countryCode: user.countryCode,
    regionCode: user.regionCode,
    city: user.city,
    postalCode: user.postalCode,
    latitude: user.latitude,
    longitude: user.longitude,
    // Income & economic
    annualPersonalIncomeUsd: user.annualPersonalIncomeUsd,
    annualHouseholdIncomeUsd: user.annualHouseholdIncomeUsd,
    annualTaxesPaidUsd: user.annualTaxesPaidUsd,
    monthlyHousingCostUsd: user.monthlyHousingCostUsd,
    householdSize: user.householdSize,
    housingStatus: user.housingStatus,
    hoursWorkedPerWeek: user.hoursWorkedPerWeek,
    industryOrSector: user.industryOrSector,
    // Demographics
    birthYear: user.birthYear,
    biologicalSex: user.biologicalSex,
    ethnicityOrRace: user.ethnicityOrRace,
    maritalStatus: user.maritalStatus,
    numberOfDependents: user.numberOfDependents,
    primaryLanguage: user.primaryLanguage,
    educationLevel: user.educationLevel,
    employmentStatus: user.employmentStatus,
    genderIdentity: user.genderIdentity,
    citizenshipStatus: user.citizenshipStatus,
    // Health / HALE
    healthInsuranceType: user.healthInsuranceType,
    chronicConditionCount: user.chronicConditionCount,
    disabilityStatus: user.disabilityStatus,
    smokingStatus: user.smokingStatus,
    alcoholFrequency: user.alcoholFrequency,
    heightCm: user.heightCm,
    // Access
    internetAccessType: user.internetAccessType,
    // Skills & tasks
    skillTags: user.skillTags,
    interestTags: user.interestTags,
    availableHoursPerWeek: user.availableHoursPerWeek,
    // Notes & meta
    censusNotes: user.censusNotes,
    censusUpdatedAt: user.censusUpdatedAt ? user.censusUpdatedAt.toISOString() : null,
    lastIncomeReportedAt: lastIncomeReportedAt ? lastIncomeReportedAt.toISOString() : null,
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

  const [healthVariable, happinessVariable, incomeVariable, personalIncomeVariable] = await Promise.all([
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
    tx.globalVariable.upsert({
      where: { name: ANNUAL_PERSONAL_INCOME_VARIABLE_NAME },
      update: {
        combinationOperation: CombinationOperation.MEAN,
        defaultUnitId: usdUnit.id,
        description: "Self-reported annual personal income in USD. Primary scoreboard metric.",
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
        description: "Self-reported annual personal income in USD. Primary scoreboard metric.",
        fillingType: FillingType.NONE,
        minimumAllowedValue: 0,
        name: ANNUAL_PERSONAL_INCOME_VARIABLE_NAME,
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
    personalIncomeGlobalVariableId: personalIncomeVariable.id,
    ratingUnitId: ratingUnit.id,
    usdUnitId: usdUnit.id,
  };
}

async function upsertDailyMeasurement(
  tx: Prisma.TransactionClient,
  input: UpsertMeasurementInput,
) {
  const nOf1Variable = await tx.nOf1Variable.upsert({
    where: {
      subjectId_globalVariableId: {
        globalVariableId: input.globalVariableId,
        subjectId: input.subjectId,
      },
    },
    update: {
      defaultUnitId: input.unitId,
    },
    create: {
      defaultUnitId: input.unitId,
      globalVariableId: input.globalVariableId,
      subjectId: input.subjectId,
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
      subjectId: input.subjectId,
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
        recordedByUserId: input.recordedByUserId,
        sourceName: input.sourceName,
        subjectId: input.subjectId,
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
        recordedByUserId: input.recordedByUserId,
        sourceName: input.sourceName,
        startTime: new Date(),
        subjectId: input.subjectId,
        unitId: input.unitId,
        value: input.value,
      },
    });
  }

  await refreshMeasurementSummaries(tx, {
    globalVariableId: input.globalVariableId,
    nOf1VariableId: nOf1Variable.id,
  });
}
