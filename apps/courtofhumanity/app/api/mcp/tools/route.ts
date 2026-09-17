import { getCourtToolCatalog } from "@/lib/mcp/catalog";

export function GET() {
  return Response.json(getCourtToolCatalog(), {
    headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" },
  });
}
