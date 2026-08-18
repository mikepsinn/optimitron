import { NextRequest, NextResponse } from "next/server";
import {
  lookupRepresentatives,
  zipToStateDistrict,
} from "@/lib/civic-data.server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state");
  const districtParam = searchParams.get("district");
  const zip = searchParams.get("zip");

  try {
    let resolvedState = state?.toUpperCase() ?? null;
    let resolvedDistrict = districtParam ? parseInt(districtParam, 10) : undefined;

    // If zip provided, resolve to state+district
    if (!resolvedState && zip) {
      const result = await zipToStateDistrict(zip);
      if (!result) {
        return NextResponse.json(
          { error: "Could not resolve ZIP code to a congressional district" },
          { status: 400 },
        );
      }
      resolvedState = result.state;
      resolvedDistrict = result.district;
    }

    if (!resolvedState) {
      return NextResponse.json(
        { error: "Provide ?state=XX or ?zip=XXXXX" },
        { status: 400 },
      );
    }

    const representatives = await lookupRepresentatives(resolvedState, resolvedDistrict);

    return NextResponse.json({ representatives });
  } catch (err) {
    console.error("civic/representatives error:", err);
    return NextResponse.json(
      { error: "Failed to fetch representatives" },
      { status: 500 },
    );
  }
}
