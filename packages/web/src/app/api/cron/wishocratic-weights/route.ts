import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { postWishocraticWeightsOnChain } from "@/lib/wishocratic-treasury.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await postWishocraticWeightsOnChain();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[WISHOCRATIC WEIGHTS CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to post Wishocratic weights." },
      { status: 500 },
    );
  }
}
