import { getRequestOrigin } from "@/lib/mcp/auth";
import { getDfdaOpenApiDocument } from "@/lib/openapi";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return Response.json(getDfdaOpenApiDocument(getRequestOrigin(request)), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      Vary: "Host, X-Forwarded-Host, X-Forwarded-Proto",
    },
  });
}
