import { NextResponse } from "next/server";
import { runDistributionOptimizer } from "@/lib/reasoning/distribution-optimizer.server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const result = await runDistributionOptimizer();
  return NextResponse.json({ ok: true, ...result });
}
