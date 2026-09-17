import { courtResourceMetadata } from "@/lib/mcp/auth";

export function GET() {
  return Response.json(courtResourceMetadata(), {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" },
  });
}
