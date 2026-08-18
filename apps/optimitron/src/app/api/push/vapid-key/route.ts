import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export async function GET() {
  const vapidPublicKey = serverEnv.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ vapidPublicKey });
}
