import { NextResponse } from "next/server";
import { takeDiversitySnapshot } from "@/lib/reasoning/diversity-guard.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const snapshots = await takeDiversitySnapshot();
  return NextResponse.json({ ok: true, snapshotCount: snapshots.length });
}
