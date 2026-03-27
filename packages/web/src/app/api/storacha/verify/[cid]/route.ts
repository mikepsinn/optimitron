import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_DEPTH = 50;
const DEFAULT_DEPTH = 10;

/**
 * GET /api/storacha/verify/{cid}?depth=10&type=wishocracy-aggregation&jurisdiction=us-federal
 *
 * Verify the history chain of a snapshot CID.
 * No Storacha client needed — reads from the public IPFS gateway.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> },
) {
  try {
    const { cid } = await params;
    const trimmed = cid.trim();

    if (!trimmed) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const depthParam = searchParams.get("depth");
    const depth = Math.min(
      depthParam ? parseInt(depthParam, 10) || DEFAULT_DEPTH : DEFAULT_DEPTH,
      MAX_DEPTH,
    );
    const typeFilter = searchParams.get("type") ?? undefined;
    const jurisdictionFilter = searchParams.get("jurisdiction") ?? undefined;

    const { verifyHistoryChain } = await import("@optimitron/storage");

    const filter: { type?: string; jurisdictionId?: string } = {};
    if (typeFilter) filter.type = typeFilter;
    if (jurisdictionFilter) filter.jurisdictionId = jurisdictionFilter;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- filter shape matches StoredSnapshotFilter
    const verification = await verifyHistoryChain(trimmed, depth, fetch, filter as any);

    return NextResponse.json(verification, {
      headers: { "Cache-Control": "public, s-maxage=600" },
    });
  } catch (error) {
    console.error("[STORACHA VERIFY] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify snapshot chain." },
      { status: 500 },
    );
  }
}
