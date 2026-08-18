import { getOAuthMetadata } from "@/lib/mcp-oauth";

export async function GET() {
  return Response.json(getOAuthMetadata());
}
