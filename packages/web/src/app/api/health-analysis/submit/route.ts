import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const HealthAnalysisRelationshipSchema = z.object({
  predictorVariableId: z.string(),
  outcomeVariableId: z.string(),
  forwardPearson: z.number(),
  reversePearson: z.number(),
  predictivePearson: z.number(),
  effectSize: z.number(),
  statisticalSignificance: z.number(),
  numberOfPairs: z.number(),
  valuePredictingHighOutcome: z.number().optional(),
  valuePredictingLowOutcome: z.number().optional(),
  optimalDailyValue: z.number().optional(),
  outcomeFollowUpPercentChangeFromBaseline: z.number().optional(),
  evidenceGrade: z.string().optional(),
  pisScore: z.number().optional(),
});

const SubmitHealthAnalysisSchema = z.object({
  contributorId: z.string().min(1),
  relationships: z.array(HealthAnalysisRelationshipSchema).min(1),
  dataSpanDays: z.number().nonnegative(),
  personhoodVerified: z.boolean().optional(),
});

// No auth required — contributions are anonymous by design
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = SubmitHealthAnalysisSchema.parse(body);

    const contribution = await prisma.healthAnalysisContribution.create({
      data: {
        contributorId: input.contributorId,
        relationshipsJson: JSON.stringify(input.relationships),
        relationshipCount: input.relationships.length,
        dataSpanDays: input.dataSpanDays,
        personhoodVerified: input.personhoodVerified ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      id: contribution.id,
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
