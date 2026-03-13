import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { NOf1VariableRelationshipSchema } from "@optomitron/optimizer";
import { prisma } from "@/lib/prisma";
import {
  SubjectType,
  CombinationOperation,
  FillingType,
  EvidenceGrade,
} from "@prisma/client";

const SubmissionRelationshipSchema = NOf1VariableRelationshipSchema.omit({
  subjectId: true,
}).extend({
  predictorVariableId: z.string().min(1),
  outcomeVariableId: z.string().min(1),
  evidenceGrade: z.string().optional(),
  pisScore: z.number().optional(),
});

const SubmitHealthAnalysisSchema = z.object({
  contributorId: z.string().min(1),
  relationships: z.array(SubmissionRelationshipSchema).min(1),
  dataSpanDays: z.number().nonnegative(),
  personhoodVerified: z.boolean().optional(),
});

/**
 * Ensure a default VariableCategory and Unit exist for creating GlobalVariables
 * when the extension submits variable names we haven't seen before.
 */
async function ensureDefaults(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const category = await tx.variableCategory.upsert({
    where: { name: "Uncategorized" },
    update: {},
    create: {
      name: "Uncategorized",
    },
  });

  const unit = await tx.unit.upsert({
    where: { abbreviatedName: "count" },
    update: {},
    create: {
      name: "Count",
      abbreviatedName: "count",
      ucumCode: "{count}",
      unitCategoryId: "Count",
    },
  });

  return { categoryId: category.id, unitId: unit.id };
}

function mapEvidenceGrade(grade: string): EvidenceGrade | null {
  const upper = grade.toUpperCase();
  const validGrades: Record<string, EvidenceGrade> = {
    A: EvidenceGrade.A,
    B: EvidenceGrade.B,
    C: EvidenceGrade.C,
    D: EvidenceGrade.D,
    F: EvidenceGrade.F,
  };
  return validGrades[upper] ?? null;
}

// No auth required — contributions are anonymous by design
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const input = SubmitHealthAnalysisSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Ensure Subject exists for this anonymous contributor
      const subject = await tx.subject.upsert({
        where: { externalId: input.contributorId },
        update: {},
        create: {
          externalId: input.contributorId,
          displayName: "Extension Contributor",
          subjectType: SubjectType.USER,
        },
      });

      const { categoryId, unitId } = await ensureDefaults(tx);

      // Collect unique variable names from all relationships
      const variableNames = new Set<string>();
      for (const rel of input.relationships) {
        variableNames.add(rel.predictorVariableId);
        variableNames.add(rel.outcomeVariableId);
      }

      // Ensure GlobalVariable records exist for each variable name
      const variableMap = new Map<string, string>(); // variable name -> DB id
      for (const varName of variableNames) {
        const globalVar = await tx.globalVariable.upsert({
          where: { name: varName },
          update: {},
          create: {
            name: varName,
            variableCategoryId: categoryId,
            defaultUnitId: unitId,
            combinationOperation: CombinationOperation.MEAN,
            fillingType: FillingType.NONE,
          },
        });
        variableMap.set(varName, globalVar.id);
      }

      // Create NOf1VariableRelationship rows
      let created = 0;
      for (const rel of input.relationships) {
        const predictorGlobalVariableId = variableMap.get(rel.predictorVariableId)!;
        const outcomeGlobalVariableId = variableMap.get(rel.outcomeVariableId)!;

        const sharedFields = {
          forwardPearsonCorrelation: rel.forwardPearson,
          reversePearsonCorrelation: rel.reversePearson,
          effectSize: rel.effectSize,
          statisticalSignificance: rel.statisticalSignificance,
          numberOfPairs: rel.numberOfPairs,
          valuePredictingHighOutcome: rel.valuePredictingHighOutcome ?? null,
          valuePredictingLowOutcome: rel.valuePredictingLowOutcome ?? null,
          optimalValue: rel.optimalDailyValue ?? null,
          outcomeFollowUpPercentChangeFromBaseline:
            rel.outcomeFollowUpPercentChangeFromBaseline ?? null,
          predictorImpactScore: rel.pisScore ?? null,
          evidenceGrade: rel.evidenceGrade
            ? mapEvidenceGrade(rel.evidenceGrade)
            : null,
          analyzedAt: new Date(),
        };

        await tx.nOf1VariableRelationship.upsert({
          where: {
            subjectId_predictorGlobalVariableId_outcomeGlobalVariableId: {
              subjectId: subject.id,
              predictorGlobalVariableId,
              outcomeGlobalVariableId,
            },
          },
          update: sharedFields,
          create: {
            subjectId: subject.id,
            predictorGlobalVariableId,
            outcomeGlobalVariableId,
            onsetDelay: 1800,
            durationOfAction: 86400,
            ...sharedFields,
          },
        });
        created++;
      }

      return { subjectId: subject.id, created };
    });

    return NextResponse.json({
      success: true,
      subjectId: result.subjectId,
      relationshipsCreated: result.created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[HEALTH-ANALYSIS] Submit error:", error);
    return NextResponse.json(
      { error: "Failed to save health analysis contribution." },
      { status: 500 },
    );
  }
}
