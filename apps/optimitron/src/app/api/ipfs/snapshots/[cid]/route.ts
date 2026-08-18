import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/ipfs/snapshots/{cid}
 *
 * Retrieve a single snapshot by its IPFS CID.
 * No provider client needed — reads from the configured public IPFS gateway,
 * so this works even when upload credentials are absent.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cid: string }> },
) {
  try {
    const { buildIpfsStorageGatewayUrl, getIpfsStorageGatewayUrlBuilder } = await import("@/lib/ipfs-storage");
    const { cid } = await params;
    const trimmed = cid.trim();

    if (!trimmed) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    const gatewayUrlBuilder = await getIpfsStorageGatewayUrlBuilder();

    const { retrieveStoredSnapshot } = await import(
      "@optimitron/storage"
    );

    let snapshot;
    try {
      snapshot = await retrieveStoredSnapshot(trimmed, fetch, gatewayUrlBuilder);
    } catch {
      return NextResponse.json(
        { error: "Snapshot not found or not a valid snapshot" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { cid: trimmed, snapshot, gatewayUrl: await buildIpfsStorageGatewayUrl(trimmed) },
      { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
    );
  } catch (error) {
    console.error("[IPFS SNAPSHOT] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve snapshot." },
      { status: 500 },
    );
  }
}
