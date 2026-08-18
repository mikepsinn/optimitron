import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildCitizenPreferenceSummary,
  buildPoliticianAlignmentResults,
  DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS,
  DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL,
  type PoliticianAlignmentInput,
  type RawPoliticianAllocations,
} from "@/lib/wishocracy-alignment";

type AlignmentRequestBody = {
  politicians?: Array<{
    politicianId?: string;
    name?: string;
    allocations?: RawPoliticianAllocations;
    votes?: RawPoliticianAllocations;
  }>;
  bootstrapIterations?: number;
  confidenceLevel?: number;
};

function parsePositiveInteger(
  value: string | number | null | undefined,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseConfidenceLevel(
  value: string | number | null | undefined,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 1 ? parsed : fallback;
}

function isRawAllocationArray(
  value: unknown,
): value is Array<{ category: string; allocationPct: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { category?: unknown }).category === "string" &&
        Number.isFinite((entry as { allocationPct?: unknown }).allocationPct),
    )
  );
}

function isRawAllocationRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, entryValue]) => typeof key === "string" && Number.isFinite(entryValue),
    )
  );
}

function isValidAllocationPayload(
  value: unknown,
): value is RawPoliticianAllocations {
  return isRawAllocationArray(value) || isRawAllocationRecord(value);
}

function parsePoliticians(
  body: AlignmentRequestBody,
): { politicians: PoliticianAlignmentInput[] } | { error: string } {
  if (!Array.isArray(body.politicians) || body.politicians.length === 0) {
    return { error: "Body must include a non-empty politicians array." };
  }

  const politicians: PoliticianAlignmentInput[] = [];
  for (const politician of body.politicians) {
    if (!politician?.politicianId) {
      return { error: "Each politician must include politicianId." };
    }

    const allocations = politician.allocations ?? politician.votes;
    if (!isValidAllocationPayload(allocations)) {
      return {
        error:
          "Each politician must include allocations or votes as an object or array of category percentages.",
      };
    }

    politicians.push({
      politicianId: politician.politicianId,
      name: politician.name,
      allocations,
    });
  }

  return { politicians };
}

async function fetchWishocraticAllocations() {
  return prisma.wishocraticAllocation.findMany({
    select: {
      userId: true,
      itemAId: true,
      itemBId: true,
      allocationA: true,
      allocationB: true,
      updatedAt: true,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const comparisons = await fetchWishocraticAllocations();
    const summary = buildCitizenPreferenceSummary(comparisons, {
      bootstrapIterations: parsePositiveInteger(
        req.nextUrl.searchParams.get("bootstrapIterations"),
        DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS,
      ),
      confidenceLevel: parseConfidenceLevel(
        req.nextUrl.searchParams.get("confidenceLevel"),
        DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL,
      ),
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to calculate wishocracy alignment summary:", error);
    return NextResponse.json(
      { error: "Failed to calculate wishocracy alignment summary." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AlignmentRequestBody;
    const parsed = parsePoliticians(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const comparisons = await fetchWishocraticAllocations();
    const summary = buildCitizenPreferenceSummary(comparisons, {
      bootstrapIterations: parsePositiveInteger(
        body.bootstrapIterations,
        DEFAULT_ALIGNMENT_BOOTSTRAP_ITERATIONS,
      ),
      confidenceLevel: parseConfidenceLevel(
        body.confidenceLevel,
        DEFAULT_ALIGNMENT_CONFIDENCE_LEVEL,
      ),
    });
    const results = buildPoliticianAlignmentResults(summary, parsed.politicians);

    if (
      results.politicians.some(
        (politician) =>
          Object.values(politician.normalizedAllocations).every((value) => value === 0),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Each politician must resolve to at least one recognized budget category with a positive allocation.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      citizenPreferences: summary,
      politicians: results.politicians,
      ranking: results.ranking,
    });
  } catch (error) {
    console.error("Failed to calculate politician alignment scores:", error);
    return NextResponse.json(
      { error: "Failed to calculate politician alignment scores." },
      { status: 500 },
    );
  }
}
