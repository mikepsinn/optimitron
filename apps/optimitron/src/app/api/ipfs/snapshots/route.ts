import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES = new Set([
  "wishocracy-aggregation",
  "optimitron-policy-analysis",
  "health-analysis",
  "encrypted-individual-submission",
]);

/**
 * GET /api/ipfs/snapshots?type=wishocracy-aggregation&jurisdiction=us-federal
 *
 * Lists recent snapshots stored in the configured IPFS storage provider.
 * Public endpoint — the data on IPFS is already public.
 */
export async function GET(request: NextRequest) {
  try {
    const { isIpfsStorageConfigured, getIpfsStorageClient, getIpfsStorageGatewayUrlBuilder } = await import(
      "@/lib/ipfs-storage"
    );

    if (!isIpfsStorageConfigured()) {
      return NextResponse.json(
        { error: "IPFS storage not configured" },
        { status: 503 },
      );
    }

    const client = await getIpfsStorageClient();
    if (!client) {
      return NextResponse.json(
        { error: "IPFS storage client unavailable" },
        { status: 503 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const typeFilter = searchParams.get("type");
    const jurisdictionFilter = searchParams.get("jurisdiction");

    if (typeFilter && !VALID_TYPES.has(typeFilter)) {
      return NextResponse.json(
        { error: `Invalid type filter. Valid types: ${[...VALID_TYPES].join(", ")}` },
        { status: 400 },
      );
    }

    const gatewayUrlBuilder = await getIpfsStorageGatewayUrlBuilder();

    const { listUploadCids, tryRetrieveStoredSnapshot } = await import(
      "@optimitron/storage"
    );

    const cids = await listUploadCids(client, { maxPages: 3 });

    const results = await Promise.all(
      cids.map(async (cid) => {
        const snapshot = await tryRetrieveStoredSnapshot(cid, fetch, gatewayUrlBuilder);
        if (!snapshot) return null;
        if (typeFilter && snapshot.type !== typeFilter) return null;
        if (jurisdictionFilter && snapshot.jurisdictionId !== jurisdictionFilter)
          return null;
        return { cid, snapshot };
      }),
    );

    const snapshots = results.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );

    return NextResponse.json(
      { snapshots },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  } catch (error) {
    console.error("[IPFS SNAPSHOTS] Error:", error);
    return NextResponse.json(
      { error: "Failed to list snapshots." },
      { status: 500 },
    );
  }
}
