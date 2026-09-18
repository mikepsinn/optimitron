import { getCourtPublicJwks } from "@/lib/mcp-court-oauth";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(getCourtPublicJwks(), {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return Response.json(
      { error: "Signing keys unavailable" },
      { status: 503 },
    );
  }
}
