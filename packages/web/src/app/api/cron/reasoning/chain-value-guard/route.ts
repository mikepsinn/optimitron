import { NextResponse } from "next/server";
import { runRGuard } from "@/lib/reasoning/r-guard.server";

/**
 * Chain-value guard runs as part of the same r-guard pipeline — thin
 * separate endpoint so both can be independently scheduled.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const result = await runRGuard();
  return NextResponse.json({ ok: true, ...result });
}
