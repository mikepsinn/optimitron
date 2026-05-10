import { NextResponse, type NextRequest } from "next/server";
import { getGovernmentLeader } from "@optimitron/data/datasets/government-leaders";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getMilitaryToGovernmentClinicalTrialRatio } from "@optimitron/data/datasets/government-spending-ratios";

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

  const leader = getGovernmentLeader(countryCode);
  if (!leader) {
    return NextResponse.json({ error: "leader not found" }, { status: 404 });
  }

  const metrics = getGovernmentMetrics(leader.countryCode);
  const militaryToClinicalTrialsRatio = metrics
    ? getMilitaryToGovernmentClinicalTrialRatio(metrics)
    : null;

  return NextResponse.json({
    countryCode: leader.countryCode,
    governmentBudgetUsd: leader.governmentBudgetUsd,
    leaderName: leader.leaderName,
    militaryBudgetUsd: leader.militaryBudgetUsd,
    militaryToClinicalTrialsRatio,
  });
}
