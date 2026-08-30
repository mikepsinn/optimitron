import { NextResponse, type NextRequest } from "next/server";
import { getGovernmentProfile } from "@optimitron/data/datasets/governments";
import { getMilitaryToGovernmentClinicalTrialRatio } from "@optimitron/data/datasets/government-spending-ratios";
import { US_FEDERAL_SPENDING_2024 } from "@optimitron/data/parameters";

export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams
    .get("countryCode")
    ?.trim()
    .toUpperCase();

  if (!countryCode) {
    return NextResponse.json(
      { error: "countryCode is required" },
      { status: 400 },
    );
  }

  const profile = getGovernmentProfile(countryCode);
  if (!profile) {
    return NextResponse.json({ error: "leader not found" }, { status: 404 });
  }

  const metrics = profile.metrics;
  const militaryToClinicalTrialsRatio = metrics
    ? getMilitaryToGovernmentClinicalTrialRatio(metrics)
    : null;

  return NextResponse.json({
    countryCode: profile.code,
    governmentBudgetUsd:
      profile.code === "US" ? US_FEDERAL_SPENDING_2024.value : null,
    leaderName: profile.leader?.leaderName ?? null,
    militaryBudgetUsd: metrics?.militarySpendingAnnual.value ?? null,
    militaryToClinicalTrialsRatio,
  });
}
