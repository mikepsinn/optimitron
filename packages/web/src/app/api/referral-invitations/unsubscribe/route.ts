import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { unsubscribeReferralInvitationRecipient } from "@/lib/referral-invitations.server";

export const runtime = "nodejs";

const log = createLogger("referral-invitation-unsubscribe");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtml(input: { headline: string; body: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — War on Disease</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:#FFE66D;border:3px solid #111827;box-shadow:8px 8px 0px 0px rgba(0,0,0,1);">
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;line-height:1.1;">${escapeHtml(input.headline)}</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${escapeHtml(input.body)}</p>
  </main>
</body>
</html>`;
}

async function parseParams(request: Request) {
  const url = new URL(request.url);
  let body: URLSearchParams | null = null;
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      body = new URLSearchParams(await request.text());
    }
  }

  return {
    invitationId: url.searchParams.get("i") ?? body?.get("i") ?? "",
    token: url.searchParams.get("t") ?? body?.get("t") ?? "",
  };
}

async function handle(request: Request, respondWithHtml: boolean) {
  const parsed = await parseParams(request);
  if (!parsed.invitationId || !parsed.token) {
    const message = "Missing unsubscribe parameters.";
    return respondWithHtml
      ? new NextResponse(renderHtml({ headline: "Unsubscribe failed", body: message }), {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const unsubscribed = await unsubscribeReferralInvitationRecipient(parsed);
    if (!unsubscribed) {
      const message = "Invalid or expired unsubscribe link.";
      return respondWithHtml
        ? new NextResponse(renderHtml({ headline: "Unsubscribe failed", body: message }), {
            status: 400,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        : NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    log.error("Failed to unsubscribe", error);
    const message = "Something went wrong. Please try again.";
    return respondWithHtml
      ? new NextResponse(renderHtml({ headline: "Unsubscribe failed", body: message }), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: message }, { status: 500 });
  }

  return respondWithHtml
    ? new NextResponse(
        renderHtml({
          headline: "You have been unsubscribed",
          body: "You will no longer receive reminders for this invitation.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    : new NextResponse(null, { status: 204 });
}

export async function GET(request: Request) {
  return handle(request, true);
}

export async function POST(request: Request) {
  return handle(request, false);
}
