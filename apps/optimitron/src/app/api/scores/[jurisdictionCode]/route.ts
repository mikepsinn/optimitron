import { NextResponse } from "next/server";
import { getLatestAggregateScores } from "@/lib/aggregate-alignment.server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jurisdictionCode: string }> },
) {
  const { jurisdictionCode } = await params;
  const data = await getLatestAggregateScores(jurisdictionCode.toUpperCase());

  if (!data) {
    return NextResponse.json(
      { error: `No aggregate scores found for jurisdiction: ${jurisdictionCode}` },
      { status: 404 },
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
