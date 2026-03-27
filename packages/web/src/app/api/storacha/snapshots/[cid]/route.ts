import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/storacha/snapshots/{cid}
 *
 * Retrieve a single snapshot by its IPFS CID.
 * No Storacha client needed — reads from the public IPFS gateway,
 * so this works even without STORACHA_KEY / STORACHA_PROOF.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cid: string }> },
) {
  try {
    const { cid } = await params;
    const trimmed = cid.trim();

    if (!trimmed) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    const { retrieveStoredSnapshot, buildStorachaGatewayUrl } = await import(
      "@optimitron/storage"
    );

    let snapshot;
    try {
      snapshot = await retrieveStoredSnapshot(trimmed);
    } catch {
      return NextResponse.json(
        { error: "Snapshot not found or not a valid snapshot" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { cid: trimmed, snapshot, gatewayUrl: buildStorachaGatewayUrl(trimmed) },
      { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
    );
  } catch (error) {
    console.error("[STORACHA SNAPSHOT] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve snapshot." },
      { status: 500 },
    );
  }
}
