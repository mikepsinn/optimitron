import { NextResponse } from "next/server";
import { runPromoter } from "@/lib/reasoning/promoter.server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const result = await runPromoter();
  return NextResponse.json({ ok: true, ...result });
}
