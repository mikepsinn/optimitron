import { NextResponse } from "next/server";

async function retired(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NextResponse.json({
    error: "This Court endpoint has moved. Reconnect on Court of Humanity.",
    code: "COURT_ENDPOINT_MOVED",
    endpoint: `https://courtofhumanity.org/api/referendums/${encodeURIComponent(slug)}/represented-people`,
  }, { status: 410 });
}

export const POST = retired;
