import { getDeveloperOpenApiDocument } from "@/lib/developer-openapi";
import { getRequestSiteOrigin } from "@/lib/site";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = getRequestSiteOrigin({
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    host: request.headers.get("host"),
  });

  return Response.json(getDeveloperOpenApiDocument(origin), {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
