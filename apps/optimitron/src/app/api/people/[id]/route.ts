import { NextResponse } from "next/server";

async function retired(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    error: "This Court endpoint has moved. Reconnect on Court of Humanity.",
    code: "COURT_ENDPOINT_MOVED",
    endpoint: `https://courtofhumanity.org/api/people/${encodeURIComponent(id)}`,
  }, { status: 410 });
}

export const PATCH = retired;
export const DELETE = retired;
