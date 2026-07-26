import {
  getMcpRequestOrigin,
  getProtectedResourceMetadata,
} from "@/lib/mcp-oauth";

// The document's `resource` value depends on the requesting host, so it must
// never be prerendered or cached — a response cached under one site variant
// would advertise the wrong resource identity to another.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return Response.json(getProtectedResourceMetadata(getMcpRequestOrigin(req)), {
    headers: { "Cache-Control": "no-store" },
  });
}
