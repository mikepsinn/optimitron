import { NextResponse } from "next/server";
import { runRGuard } from "@/lib/reasoning/r-guard.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const result = await runRGuard();
  return NextResponse.json({ ok: true, ...result });
}
