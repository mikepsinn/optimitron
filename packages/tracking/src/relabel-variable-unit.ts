// Admin repair for a variable whose canonical unit was wrong from the start,
// e.g. a 7.5 mg dose stored as "7.5 count" (#375). The amounts are right and
// only the label is wrong, so this changes unit IDs and never changes values.
// Runtime Prisma use is limited to SQL template builders. Hosts inject the connection.
import { Prisma } from "@optimitron/db";

import { lockTrackingVariable } from "./core";
import {
  refreshGlobalVariableSummary,
  refreshNOf1VariableSummary,
} from "./measurement-summaries";
import { optionalString } from "./parse";
import type { TrackingPrismaClient } from "./types";
import { convertTrackingValue } from "./units";

const RELABEL_UNIT_SELECT = {
  abbreviatedName: true,
  id: true,
  name: true,
} satisfies Prisma.UnitSelect;

function requiredString(input: Record<string, unknown>, fieldName: string) {
  const value = optionalString(input[fieldName]);
  if (!value) throw new Error(`${fieldName} is required.`);
  return value;
}

async function findUnit(
  tx: Prisma.TransactionClient,
  value: string,
  fieldName: string,
) {
  const unit = await tx.unit.findFirst({
    select: RELABEL_UNIT_SELECT,
    where: {
      deletedAt: null,
      OR: [{ id: value }, { abbreviatedName: value }],
    },
  });
  if (!unit) {
    throw new Error(
      `${fieldName} was not found: ${value}. Pass a unit ID or an exact abbreviation such as mg or count.`,
    );
  }
  return unit;
}

/**
 * Wait for writers that hold the shared variable lock, and keep new writers
 * out until the relabel commits. The subject locks, taken in a stable order,
 * also serialize normalizeMeasurements, which takes only those.
 */
async function lockVariableUnits(
  tx: Prisma.TransactionClient,
  globalVariableId: string,
) {
  await lockTrackingVariable(tx, globalVariableId, "exclusive");
  await tx.$queryRaw(Prisma.sql`
    SELECT pg_advisory_xact_lock(hashtextextended(
      'tracking-units:' || v."subjectId" || ':' || v."globalVariableId", 0
    ))::text
    FROM (SELECT "subjectId", "globalVariableId" FROM "NOf1Variable"
      WHERE "globalVariableId" = ${globalVariableId} ORDER BY "id") v
  `);
}

/**
 * Relabel every amount stored in a variable's canonical unit as another unit,
 * for all subjects. Dry run by default; `apply: true` needs the measurement
 * count from the dry run so the admin approves exactly what the dry run showed.
 *
 * Reminder presets and notification receipts have no unit column. They read
 * in the personal unit, else the canonical unit, so they follow the relabel
 * with the same numbers. Amounts stored in any other unit stay as they are.
 */
export async function relabelVariableUnit(
  db: TrackingPrismaClient,
  input: Record<string, unknown>,
  actorUserId: string,
) {
  const globalVariableId = requiredString(input, "globalVariableId");
  const fromUnitKey = requiredString(input, "fromUnit");
  const toUnitKey = requiredString(input, "toUnit");
  if ("apply" in input && typeof input.apply !== "boolean") {
    throw new Error("apply must be a boolean.");
  }
  const apply = input.apply === true;
  const expectedMeasurementCount = input.expectedMeasurementCount;
  if (
    apply &&
    !(
      typeof expectedMeasurementCount === "number" &&
      Number.isInteger(expectedMeasurementCount) &&
      expectedMeasurementCount >= 0
    )
  ) {
    throw new Error(
      "expectedMeasurementCount is required with apply: true. Run a dry run first and pass its counts.measurements.",
    );
  }

  return db.$transaction(
    async (tx) => {
      const fromUnit = await findUnit(tx, fromUnitKey, "fromUnit");
      const toUnit = await findUnit(tx, toUnitKey, "toUnit");
      if (fromUnit.id === toUnit.id) {
        throw new Error("fromUnit and toUnit are the same unit.");
      }
      if (apply) await lockVariableUnits(tx, globalVariableId);
      const variable = await tx.globalVariable.findFirst({
        select: {
          defaultUnit: { select: RELABEL_UNIT_SELECT },
          defaultUnitId: true,
          fillingValue: true,
          id: true,
          maximumAllowedValue: true,
          minimumAllowedValue: true,
          name: true,
        },
        where: { deletedAt: null, id: globalVariableId },
      });
      if (!variable) {
        throw new Error(`GlobalVariable not found: ${globalVariableId}`);
      }
      if (variable.defaultUnitId !== fromUnit.id) {
        throw new Error(
          `${variable.name} stores amounts in ${variable.defaultUnit.abbreviatedName}, not ${fromUnit.abbreviatedName}. fromUnit must be the current canonical unit.`,
        );
      }

      // A personal unit in a third unit must still convert to the new
      // canonical unit, or its owner's next entry fails.
      const otherPersonalUnits = await tx.unit.findMany({
        select: RELABEL_UNIT_SELECT,
        where: {
          id: { notIn: [fromUnit.id, toUnit.id] },
          nOf1Variables: { some: { globalVariableId } },
        },
      });
      for (const unit of otherPersonalUnits) {
        try {
          convertTrackingValue(1, unit, toUnit);
        } catch {
          throw new Error(
            `A personal unit setting for ${variable.name} uses ${unit.abbreviatedName}, which cannot convert to ${toUnit.abbreviatedName}. Its owner must change that setting first.`,
          );
        }
      }

      // A row converted to or from the wrong unit has an amount that a
      // relabel cannot correct, so its owner must correct it first.
      const convertedMeasurements = await tx.measurement.count({
        where: {
          deletedAt: null,
          globalVariableId,
          OR: [
            { originalUnitId: { not: fromUnit.id }, unitId: fromUnit.id },
            { originalUnitId: fromUnit.id, unitId: { not: fromUnit.id } },
          ],
        },
      });
      if (convertedMeasurements > 0) {
        throw new Error(
          `${convertedMeasurements} measurement(s) of ${variable.name} were converted between ${fromUnit.abbreviatedName} and another unit. A relabel would make those amounts wrong. Correct them with updateMeasurement first.`,
        );
      }

      const relabeledMeasurements = {
        globalVariableId,
        originalUnitId: fromUnit.id,
        unitId: fromUnit.id,
      } satisfies Prisma.MeasurementWhereInput;
      const readsInFromUnit = {
        globalVariableId,
        OR: [{ defaultUnitId: fromUnit.id }, { defaultUnitId: null }],
      } satisfies Prisma.NOf1VariableWhereInput;
      // An aggregate without GROUP BY always returns exactly one row.
      const [subjectCounts] = await tx.$queryRaw<
        Array<{ otherSubjects: number; subjects: number }>
      >(Prisma.sql`
        SELECT COUNT(*)::int AS "subjects",
          (COUNT(*) FILTER (WHERE s."userId" IS DISTINCT FROM ${actorUserId}))::int AS "otherSubjects"
        FROM "Subject" s
        WHERE s."id" IN (
          SELECT "subjectId" FROM "NOf1Variable"
          WHERE "globalVariableId" = ${globalVariableId}
            AND ("defaultUnitId" = ${fromUnit.id} OR "defaultUnitId" IS NULL)
          UNION
          SELECT "subjectId" FROM "Measurement"
          WHERE "globalVariableId" = ${globalVariableId}
            AND "unitId" = ${fromUnit.id} AND "originalUnitId" = ${fromUnit.id}
        )
      `);
      const measurements = await tx.measurement.count({
        where: relabeledMeasurements,
      });
      const nOf1Variables = await tx.nOf1Variable.count({
        where: readsInFromUnit,
      });
      const trackingReminders = await tx.trackingReminder.count({
        where: { deletedAt: null, nOf1Variable: readsInFromUnit },
      });
      const trackedNotifications = await tx.trackingReminderNotification.count(
        {
          where: {
            deletedAt: null,
            trackedValue: { not: null },
            trackingReminder: { nOf1Variable: readsInFromUnit },
          },
        },
      );

      if (apply) {
        if (measurements !== expectedMeasurementCount) {
          throw new Error(
            `${measurements} measurements now match, not ${expectedMeasurementCount}. Run a new dry run.`,
          );
        }
        await tx.globalVariable.update({
          data: { defaultUnitId: toUnit.id },
          where: { id: variable.id },
        });
        await tx.nOf1Variable.updateMany({
          data: { defaultUnitId: toUnit.id },
          where: { defaultUnitId: fromUnit.id, globalVariableId },
        });
        await tx.measurement.updateMany({
          data: { originalUnitId: toUnit.id, unitId: toUnit.id },
          where: relabeledMeasurements,
        });
        // The amounts do not change. A summary changes where legacy rows
        // already stored in toUnit now join the canonical unit, so refresh
        // every personal summary that now reads in toUnit.
        await refreshGlobalVariableSummary(tx, variable.id);
        const toUnitNOf1VariableIds = (
          await tx.measurement.findMany({
            distinct: ["nOf1VariableId"],
            select: { nOf1VariableId: true },
            where: { deletedAt: null, globalVariableId, unitId: toUnit.id },
          })
        )
          .map((row) => row.nOf1VariableId)
          .sort();
        for (const nOf1VariableId of toUnitNOf1VariableIds)
          await refreshNOf1VariableSummary(tx, nOf1VariableId);
      }

      return {
        applied: apply,
        counts: {
          measurements,
          nOf1Variables,
          otherSubjects: subjectCounts.otherSubjects,
          subjects: subjectCounts.subjects,
          trackedNotifications,
          trackingReminders,
        },
        fromUnit,
        globalVariable: { id: variable.id, name: variable.name },
        toUnit,
        // These keep their numbers and read in toUnit after the relabel.
        variableAmounts: {
          fillingValue: variable.fillingValue,
          maximumAllowedValue: variable.maximumAllowedValue,
          minimumAllowedValue: variable.minimumAllowedValue,
        },
      };
    },
    { maxWait: 30_000, timeout: 60_000 },
  );
}
