import {
  convertUnit,
  getUnitDefinition,
} from "@optimitron/data/unit-conversion";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  handleTrackingToolCall,
  setTrackingPrismaProvider,
  updateTrackingVariableSettingsForUser,
} from "@optimitron/tracking";
import type { TrackingToolName } from "@optimitron/tracking";
import { normalizeMeasurements } from "@optimitron/tracking/normalize-measurements";
import { relabelVariableUnit } from "@optimitron/tracking/relabel-variable-unit";
import { prisma } from "@/lib/prisma";

const PREFIX = "measurement_units_test_";
const USER = `${PREFIX}user`;
const OTHER_USER = `${PREFIX}other`;
const VARIABLE = `${PREFIX}variable`;
const NOF1 = `${PREFIX}nof1`;
const SUBJECT = `${PREFIX}subject`;
const TIME = "2026-09-14T14:00:00.000Z";
const TEST_VARIABLES = { name: { startsWith: PREFIX } };
let mg: string;
let grams: string;
let count: string;

async function cleanup() {
  await prisma.trackingReminderNotification.deleteMany({
    where: { trackingReminder: { globalVariable: TEST_VARIABLES } },
  });
  await prisma.trackingReminder.deleteMany({
    where: { globalVariable: TEST_VARIABLES },
  });
  await prisma.measurement.deleteMany({
    where: { globalVariable: TEST_VARIABLES },
  });
  await prisma.nOf1Variable.deleteMany({
    where: { globalVariable: TEST_VARIABLES },
  });
  await prisma.globalVariable.deleteMany({ where: TEST_VARIABLES });
  await prisma.subject.deleteMany({
    where: { OR: [{ id: SUBJECT }, { userId: { in: [USER, OTHER_USER] } }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: [USER, OTHER_USER] } } });
  await prisma.variableCategory.deleteMany({
    where: { id: `${PREFIX}category` },
  });
}

async function call(
  name: TrackingToolName,
  args: Record<string, unknown>,
  userId = USER,
) {
  const response = await handleTrackingToolCall({
    name,
    args,
    userId,
    authRequired: () => {
      throw new Error("Unauthorized");
    },
  });
  // The same JSON boundary clients receive over MCP; the database and handlers are real.
  return JSON.parse(response.content[0]!.text);
}

async function record(
  value: number,
  unitAbbreviation = "mg",
  startTime = TIME,
) {
  return (
    await call("recordMeasurement", {
      globalVariableId: VARIABLE,
      value,
      unitAbbreviation,
      startTime,
    })
  ).result.measurement;
}

async function reminder(time = "08:00", value = 150) {
  return (
    await call("upsertTrackingReminder", {
      globalVariableId: VARIABLE,
      reminderStartTime: time,
      unitAbbreviation: "mg",
      defaultValue: value,
      startTrackingDate: "2026-09-01T00:00:00Z",
    })
  ).result.reminder;
}

describe("measurement units through MCP and PostgreSQL", () => {
  beforeEach(async () => {
    await cleanup();
    for (const [abbreviatedName, name, ucumCode, unitCategoryId] of [
      ["mg", "Milligrams", "mg", "Weight"],
      ["g", "Grams", "g", "Weight"],
      ["mL", "Milliliters", "mL", "Volume"],
      ["servings", "Servings", "{serving}", "Count"],
      ["count", "Count", "{count}", "Count"],
    ]) {
      await prisma.unit.upsert({
        where: { abbreviatedName },
        update: {},
        create: { abbreviatedName, name, ucumCode, unitCategoryId },
      });
    }
    mg = (
      await prisma.unit.findUniqueOrThrow({ where: { abbreviatedName: "mg" } })
    ).id;
    grams = (
      await prisma.unit.findUniqueOrThrow({ where: { abbreviatedName: "g" } })
    ).id;
    count = (
      await prisma.unit.findUniqueOrThrow({
        where: { abbreviatedName: "count" },
      })
    ).id;
    await prisma.user.createMany({
      data: [USER, OTHER_USER].map((id) => ({
        id,
        email: `${id}@example.test`,
        timeZone: "America/Chicago",
      })),
    });
    await prisma.subject.create({ data: { id: SUBJECT, userId: USER } });
    await prisma.variableCategory.create({
      data: {
        id: `${PREFIX}category`,
        name: `${PREFIX}category`,
        defaultUnitId: mg,
      },
    });
    await prisma.globalVariable.create({
      data: {
        id: VARIABLE,
        name: VARIABLE,
        defaultUnitId: mg,
        variableCategoryId: `${PREFIX}category`,
      },
    });
    await prisma.nOf1Variable.create({
      data: {
        id: NOF1,
        subjectId: SUBJECT,
        globalVariableId: VARIABLE,
        defaultUnitId: mg,
      },
    });
    setTrackingPrismaProvider(async () => prisma, {
      convertUnit,
      getUnitDefinition,
    });
  });
  afterAll(cleanup);

  it("normalizes mixed units, preserves entered values, and keeps a one-time unit out of personal defaults", async () => {
    await record(150);
    const second = await record(0.15, "g", "2026-09-14T15:00:00Z");
    expect(second).toMatchObject({
      value: 150,
      unitId: mg,
      originalValue: 0.15,
      originalUnitId: grams,
    });
    const personal = await prisma.nOf1Variable.findUniqueOrThrow({
      where: { id: NOF1 },
    });
    expect(personal).toMatchObject({
      defaultUnitId: mg,
      mean: 150,
      numberOfMeasurements: 2,
    });
    expect(
      await prisma.globalVariable.findUniqueOrThrow({
        where: { id: VARIABLE },
      }),
    ).toMatchObject({ mean: 150, numberOfMeasurements: 2 });
  });

  it("corrects amount and unit by ID without a duplicate or metadata loss", async () => {
    const row = await record(150);
    await prisma.measurement.update({
      where: { id: row.id },
      data: { note: "Keep this note", duration: 60 },
    });
    const corrected = await call("updateMeasurement", {
      measurementId: row.id,
      value: 0.2,
      unitName: "grams",
    });
    expect(corrected.measurement).toMatchObject({
      id: row.id,
      value: 200,
      unit: { id: mg },
      originalValue: 0.2,
      originalUnit: { id: grams },
      startTime: TIME,
      note: "Keep this note",
      duration: 60,
    });
    expect(
      await prisma.measurement.count({ where: { globalVariableId: VARIABLE } }),
    ).toBe(1);
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ mean: 200, defaultUnitId: mg });
  });

  it("derives originalValue for existing clients and rejects inconsistent double representations", async () => {
    const row = await record(0.15, "g");
    const result = await call("updateMeasurement", {
      measurementId: row.id,
      value: 200,
    });
    expect(result.measurement).toMatchObject({
      value: 200,
      originalValue: 0.2,
      originalUnit: { id: grams },
    });
    await expect(
      call("updateMeasurement", {
        measurementId: row.id,
        value: 300,
        originalValue: 10,
      }),
    ).rejects.toThrow("does not match");
    expect(
      await prisma.measurement.findUniqueOrThrow({ where: { id: row.id } }),
    ).toMatchObject({ value: 200, originalValue: 0.2 });
  });

  it("rejects unknown, incompatible, and unauthorized corrections with no persisted changes", async () => {
    const row = await record(150);
    await expect(
      call("updateMeasurement", {
        measurementId: row.id,
        value: 1,
        unitAbbreviation: "mL",
      }),
    ).rejects.toThrow("Cannot convert");
    await expect(
      call("updateMeasurement", {
        measurementId: row.id,
        value: 1,
        unitAbbreviation: "unknown-unit",
      }),
    ).rejects.toThrow("not found");
    await expect(
      call(
        "updateMeasurement",
        { measurementId: row.id, value: 0.2, unitId: grams },
        OTHER_USER,
      ),
    ).rejects.toThrow("Measurement not found");
    await expect(record(1, "servings", "2026-09-14T15:00:00Z")).rejects.toThrow(
      "Cannot convert",
    );
    expect(
      await prisma.measurement.findUniqueOrThrow({ where: { id: row.id } }),
    ).toMatchObject({
      value: 150,
      unitId: mg,
      originalValue: 150,
      originalUnitId: mg,
    });
    expect(
      await prisma.measurement.count({ where: { globalVariableId: VARIABLE } }),
    ).toBe(1);
  });

  it("converts every reminder preset and personal limit when the preferred unit changes", async () => {
    const first = await reminder();
    const second = await reminder("20:00", 200);
    await prisma.nOf1Variable.update({
      where: { id: NOF1 },
      data: {
        fillingValue: 150,
        minimumAllowedValue: 50,
        maximumAllowedValue: 300,
      },
    });
    await record(0.1, "g");
    expect(
      await prisma.trackingReminder.findUniqueOrThrow({
        where: { id: first.id },
      }),
    ).toMatchObject({ defaultValue: 150 });
    const updated = await call("upsertTrackingReminder", {
      trackingReminderId: first.id,
      unitAbbreviation: "g",
    });
    expect(updated.result.reminder).toMatchObject({
      id: first.id,
      defaultValue: 0.15,
    });
    expect(updated.result.unit.id).toBe(grams);
    expect(
      await prisma.trackingReminder.findUniqueOrThrow({
        where: { id: second.id },
      }),
    ).toMatchObject({ defaultValue: 0.2 });
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({
      defaultUnitId: grams,
      fillingValue: 0.15,
      minimumAllowedValue: 0.05,
      maximumAllowedValue: 0.3,
    });
    const row = (
      await call("recordMeasurement", {
        globalVariableId: VARIABLE,
        value: 0.15,
        startTime: "2026-09-14T16:00:00Z",
      })
    ).result.measurement;
    expect(row).toMatchObject({
      value: 150,
      unitId: mg,
      originalValue: 0.15,
      originalUnitId: grams,
    });
  });

  it("preserves the converted preset when a unit-only edit identifies the reminder by its schedule", async () => {
    const r = await reminder();
    const updated = await call("upsertTrackingReminder", {
      globalVariableId: VARIABLE,
      reminderStartTime: "08:00",
      unitAbbreviation: "g",
    });
    expect(updated.result.reminder).toMatchObject({
      id: r.id,
      defaultValue: 0.15,
    });
    expect(updated.result.unit.id).toBe(grams);
  });

  it("applies an explicitly replaced preset in the new unit and keeps REST preference edits consistent", async () => {
    const r = await reminder();
    await call("upsertTrackingReminder", {
      trackingReminderId: r.id,
      unitAbbreviation: "g",
      defaultValue: 0.25,
    });
    await updateTrackingVariableSettingsForUser(
      { globalVariableId: VARIABLE, unitAbbreviation: "mg" },
      USER,
    );
    expect(
      await prisma.trackingReminder.findUniqueOrThrow({ where: { id: r.id } }),
    ).toMatchObject({ defaultValue: 250 });
    await expect(
      call("upsertTrackingReminder", {
        trackingReminderId: r.id,
        unitAbbreviation: "mL",
      }),
    ).rejects.toThrow("Cannot convert");
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ defaultUnitId: mg });
  });

  it("converts a reminder default for a one-time response unit and retains its personal-unit receipt", async () => {
    const r = await reminder();
    await call("respondToTrackingReminder", {
      trackingReminderId: r.id,
      status: "TRACKED",
      unitAbbreviation: "g",
      dateKey: "2026-09-14",
      trackedAt: TIME,
    });
    expect(
      await prisma.measurement.findFirstOrThrow({
        where: { globalVariableId: VARIABLE },
      }),
    ).toMatchObject({
      value: 150,
      unitId: mg,
      originalValue: 0.15,
      originalUnitId: grams,
    });
    expect(
      await prisma.trackingReminderNotification.findFirstOrThrow({
        where: { trackingReminderId: r.id },
      }),
    ).toMatchObject({ trackedValue: 150 });
    await expect(
      call("upsertTrackingReminder", {
        trackingReminderId: r.id,
        unitAbbreviation: "g",
      }),
    ).rejects.toThrow("receipts have no unit metadata");
    expect(
      await prisma.trackingReminderNotification.findFirstOrThrow({
        where: { trackingReminderId: r.id },
      }),
    ).toMatchObject({ trackedValue: 150 });
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ defaultUnitId: mg });
  });

  it("leaves legacy receipts from different historical units untouched", async () => {
    const r = await reminder();
    await prisma.trackingReminderNotification.createMany({
      data: [150, 0.15].map((trackedValue, index) => ({
        userId: USER,
        trackingReminderId: r.id,
        trackedValue,
        status: "TRACKED",
        notifyAt: new Date(`2026-09-${14 + index}T14:00:00Z`),
      })),
    });
    await prisma.nOf1Variable.update({
      where: { id: NOF1 },
      data: { defaultUnitId: grams },
    });
    await expect(
      call("upsertTrackingReminder", {
        trackingReminderId: r.id,
        unitAbbreviation: "mg",
      }),
    ).rejects.toThrow("receipts have no unit metadata");
    const rows = await prisma.trackingReminderNotification.findMany({
      where: { trackingReminderId: r.id },
      orderBy: { notifyAt: "asc" },
    });
    expect(rows.map((row) => row.trackedValue)).toEqual([150, 0.15]);
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ defaultUnitId: grams });
  });

  it("serializes settings-only amount edits with a unit preference change", async () => {
    await reminder();
    for (let index = 0; index < 4; index++) {
      await updateTrackingVariableSettingsForUser(
        {
          globalVariableId: VARIABLE,
          unitAbbreviation: "mg",
          fillingValue: 150,
        },
        USER,
      );
      await Promise.all([
        updateTrackingVariableSettingsForUser(
          { globalVariableId: VARIABLE, unitAbbreviation: "g" },
          USER,
        ),
        updateTrackingVariableSettingsForUser(
          { globalVariableId: VARIABLE, fillingValue: 200 },
          USER,
        ),
      ]);
      const row = await prisma.nOf1Variable.findUniqueOrThrow({
        where: { id: NOF1 },
      });
      expect(row.defaultUnitId).toBe(grams);
      // Both serial orders are valid. A conversion of the stale 150 is not.
      expect([0.2, 200]).toContain(row.fillingValue);
    }
  });

  it("allows a no-op legacy unit during an unrelated reminder edit", async () => {
    const r = await reminder();
    const unit = await prisma.unit.findUniqueOrThrow({
      where: { abbreviatedName: "servings" },
    });
    await prisma.nOf1Variable.update({
      where: { id: NOF1 },
      data: { defaultUnitId: unit.id },
    });
    const result = await call("upsertTrackingReminder", {
      trackingReminderId: r.id,
      unitAbbreviation: "servings",
      instructions: "Updated instructions",
    });
    expect(result.result.reminder).toMatchObject({
      id: r.id,
      instructions: "Updated instructions",
      defaultValue: 150,
    });
  });

  it("keeps a reminder amount consistent when a preference change races its first response", async () => {
    const r = await reminder();
    const [preference, response] = await Promise.allSettled([
      call("upsertTrackingReminder", {
        trackingReminderId: r.id,
        unitAbbreviation: "g",
      }),
      call("respondToTrackingReminder", {
        trackingReminderId: r.id,
        status: "TRACKED",
        dateKey: "2026-09-14",
        trackedAt: TIME,
      }),
    ]);
    expect(response.status).toBe("fulfilled");
    if (preference.status === "rejected")
      expect(String(preference.reason)).toContain(
        "receipts have no unit metadata",
      );
    const rows = await prisma.measurement.findMany({
      where: { globalVariableId: VARIABLE },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ value: 150, unitId: mg });
  });

  it("repairs multiple pages and refreshes the final summary across all batches", async () => {
    await prisma.measurement.createMany({
      data: Array.from({ length: 1001 }, (_, index) => ({
        subjectId: SUBJECT,
        nOf1VariableId: NOF1,
        globalVariableId: VARIABLE,
        startTime: new Date(Date.parse(TIME) + index * 1000),
        value: 0.1,
        unitId: grams,
        originalValue: 0.1,
        originalUnitId: grams,
      })),
    });
    expect(
      await normalizeMeasurements(prisma, {
        globalVariableId: VARIABLE,
        apply: true,
      }),
    ).toMatchObject({
      examined: 1001,
      changed: 1001,
      incompatible: [],
    });
    expect(
      await prisma.measurement.count({
        where: {
          globalVariableId: VARIABLE,
          value: 100,
          unitId: mg,
          originalValue: 0.1,
          originalUnitId: grams,
        },
      }),
    ).toBe(1001);
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ mean: 100, numberOfMeasurements: 1001 });
  });

  it("repairs legacy unit rows with an idempotent dry-run command and suppresses mixed-unit summaries", async () => {
    const first = await record(150);
    await prisma.measurement.update({
      where: { id: first.id },
      data: {
        value: 0.15,
        unitId: grams,
        originalValue: 0.15,
        originalUnitId: grams,
      },
    });
    await record(150, "mg", "2026-09-14T15:00:00Z");
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ mean: null, numberOfMeasurements: 2 });
    expect(
      await normalizeMeasurements(prisma, { globalVariableId: VARIABLE }),
    ).toMatchObject({ examined: 2, changed: 1, incompatible: [] });
    expect(
      await prisma.measurement.findUniqueOrThrow({ where: { id: first.id } }),
    ).toMatchObject({ value: 0.15, unitId: grams });
    expect(
      await normalizeMeasurements(prisma, {
        globalVariableId: VARIABLE,
        apply: true,
      }),
    ).toMatchObject({ changed: 1, incompatible: [] });
    expect(
      await prisma.measurement.findUniqueOrThrow({ where: { id: first.id } }),
    ).toMatchObject({
      value: 150,
      unitId: mg,
      originalValue: 0.15,
      originalUnitId: grams,
    });
    expect(
      await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
    ).toMatchObject({ mean: 150 });
    expect(
      await normalizeMeasurements(prisma, {
        globalVariableId: VARIABLE,
        apply: true,
      }),
    ).toMatchObject({ changed: 0 });
  });

  describe("relabelVariableUnit", () => {
    const RELABEL = {
      globalVariableId: VARIABLE,
      fromUnit: "count",
      toUnit: "mg",
    };

    beforeEach(async () => {
      await prisma.globalVariable.update({
        where: { id: VARIABLE },
        data: { defaultUnitId: count, minimumAllowedValue: 0 },
      });
      await prisma.nOf1Variable.update({
        where: { id: NOF1 },
        data: { defaultUnitId: count },
      });
    });

    it("relabels a dose stored in count as mg for every user and keeps every amount", async () => {
      const dose = (
        await call("upsertTrackingReminder", {
          globalVariableId: VARIABLE,
          reminderStartTime: "22:30",
          defaultValue: 7.5,
          startTrackingDate: "2026-09-01T00:00:00Z",
        })
      ).result.reminder;
      // The reported failure: a user edit cannot leave the canonical unit.
      await expect(
        call("upsertTrackingReminder", {
          trackingReminderId: dose.id,
          unitAbbreviation: "mg",
          defaultValue: 7.5,
        }),
      ).rejects.toThrow("Cannot convert mg to count");
      await call("respondToTrackingReminder", {
        trackingReminderId: dose.id,
        status: "TRACKED",
        dateKey: "2026-09-14",
        trackedAt: TIME,
      });
      await call(
        "recordMeasurement",
        { globalVariableId: VARIABLE, value: 15, startTime: TIME },
        OTHER_USER,
      );

      const dryRun = await relabelVariableUnit(prisma, RELABEL, USER);
      expect(dryRun).toMatchObject({
        applied: false,
        counts: {
          measurements: 2,
          nOf1Variables: 2,
          otherSubjects: 1,
          subjects: 2,
          trackedNotifications: 1,
          trackingReminders: 1,
        },
      });
      expect(
        await prisma.measurement.count({
          where: { globalVariableId: VARIABLE, unitId: count },
        }),
      ).toBe(2);

      await relabelVariableUnit(
        prisma,
        { ...RELABEL, apply: true, expectedCounts: dryRun.counts },
        USER,
      );
      expect(
        await prisma.globalVariable.findUniqueOrThrow({
          where: { id: VARIABLE },
        }),
      ).toMatchObject({
        defaultUnitId: mg,
        mean: 11.25,
        minimumAllowedValue: 0,
        numberOfMeasurements: 2,
      });
      expect(
        await prisma.nOf1Variable.findMany({
          where: { globalVariableId: VARIABLE },
          select: { defaultUnitId: true },
        }),
      ).toEqual([{ defaultUnitId: mg }, { defaultUnitId: mg }]);
      const rows = await prisma.measurement.findMany({
        where: { globalVariableId: VARIABLE },
        orderBy: { value: "asc" },
      });
      expect(
        rows.map((row) => [
          row.value,
          row.unitId,
          row.originalValue,
          row.originalUnitId,
        ]),
      ).toEqual([
        [7.5, mg, 7.5, mg],
        [15, mg, 15, mg],
      ]);
      expect(
        await prisma.trackingReminderNotification.findFirstOrThrow({
          where: { trackingReminderId: dose.id },
        }),
      ).toMatchObject({ trackedValue: 7.5 });

      const corrected = await call("upsertTrackingReminder", {
        trackingReminderId: dose.id,
        unitAbbreviation: "mg",
        defaultValue: 7.5,
      });
      expect(corrected.result.reminder).toMatchObject({ defaultValue: 7.5 });
      expect(corrected.result.unit.id).toBe(mg);
    });

    it("refreshes a personal summary whose legacy rows already use the new unit", async () => {
      await prisma.measurement.create({
        data: {
          subjectId: SUBJECT,
          nOf1VariableId: NOF1,
          globalVariableId: VARIABLE,
          startTime: new Date(TIME),
          value: 7.5,
          unitId: mg,
          originalValue: 7.5,
          originalUnitId: mg,
        },
      });
      const { counts } = await relabelVariableUnit(prisma, RELABEL, USER);
      await relabelVariableUnit(
        prisma,
        { ...RELABEL, apply: true, expectedCounts: counts },
        USER,
      );
      expect(
        await prisma.nOf1Variable.findUniqueOrThrow({ where: { id: NOF1 } }),
      ).toMatchObject({ mean: 7.5, numberOfMeasurements: 1 });
    });

    it("refuses a stale unit, changed counts, a stranded personal unit, or a converted row and changes nothing", async () => {
      await record(7.5, "count");
      await expect(
        relabelVariableUnit(
          prisma,
          { ...RELABEL, fromUnit: "mg", toUnit: "g" },
          USER,
        ),
      ).rejects.toThrow("fromUnit must be the current canonical unit");
      await expect(
        relabelVariableUnit(prisma, { ...RELABEL, apply: true }, USER),
      ).rejects.toThrow("expectedCounts is required");
      const { counts } = await relabelVariableUnit(prisma, RELABEL, USER);
      // Another user starts a reminder after the dry run. That adds no
      // measurement, but the apply would relabel that user's preset.
      await call(
        "upsertTrackingReminder",
        {
          globalVariableId: VARIABLE,
          reminderStartTime: "08:00",
          defaultValue: 1,
          startTrackingDate: "2026-09-01T00:00:00Z",
        },
        OTHER_USER,
      );
      await expect(
        relabelVariableUnit(
          prisma,
          { ...RELABEL, apply: true, expectedCounts: counts },
          USER,
        ),
      ).rejects.toThrow("otherSubjects is 1, not 0");
      const servings = await prisma.unit.findUniqueOrThrow({
        where: { abbreviatedName: "servings" },
      });
      await prisma.nOf1Variable.update({
        where: { id: NOF1 },
        data: { defaultUnitId: servings.id },
      });
      await expect(
        relabelVariableUnit(prisma, RELABEL, USER),
      ).rejects.toThrow("uses servings, which cannot convert to mg");
      await prisma.nOf1Variable.update({
        where: { id: NOF1 },
        data: { defaultUnitId: count },
      });
      await prisma.measurement.create({
        data: {
          subjectId: SUBJECT,
          nOf1VariableId: NOF1,
          globalVariableId: VARIABLE,
          startTime: new Date("2026-09-14T15:00:00Z"),
          value: 2,
          unitId: count,
          originalValue: 1,
          originalUnitId: servings.id,
        },
      });
      await expect(
        relabelVariableUnit(prisma, RELABEL, USER),
      ).rejects.toThrow("were converted between count and another unit");

      expect(
        await prisma.globalVariable.findUniqueOrThrow({
          where: { id: VARIABLE },
        }),
      ).toMatchObject({ defaultUnitId: count });
      expect(
        await prisma.measurement.count({
          where: { globalVariableId: VARIABLE, unitId: count },
        }),
      ).toBe(2);
    });
  });

  it("requires an explicit unit before a new variable inherits a count default", async () => {
    await prisma.variableCategory.update({
      where: { id: `${PREFIX}category` },
      data: { defaultUnitId: count },
    });
    const input = {
      variableName: `${PREFIX}new dose`,
      categoryName: `${PREFIX}category`,
      value: 7.5,
      startTime: TIME,
    };
    await expect(call("recordMeasurement", input)).rejects.toThrow(
      "defaults to count",
    );
    expect(
      await prisma.globalVariable.count({
        where: { name: input.variableName },
      }),
    ).toBe(0);
    const created = await call("recordMeasurement", {
      ...input,
      unitAbbreviation: "mg",
    });
    expect(created.result.globalVariable.defaultUnitId).toBe(mg);
  });
});
