import { NextResponse } from "next/server";
import { unsubscribeTaskCommunication } from "@/lib/tasks/task-notifications.server";

export const runtime = "nodejs";

function renderHtml(success: boolean) {
  const headline = success ? "You have been unsubscribed" : "Unsubscribe failed";
  const body = success
    ? "You will no longer receive this kind of task notification at this address."
    : "This unsubscribe link is invalid or has expired.";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${headline} - Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:#ffffff;border:3px solid #111827;">
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;line-height:1.1;">${headline}</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${body}</p>
  </main>
</body>
</html>`;
}

async function handle(request: Request, html: boolean) {
  const url = new URL(request.url);
  const communicationId = url.searchParams.get("c") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const success =
    communicationId.length > 0 && token.length > 0
      ? await unsubscribeTaskCommunication({ communicationId, token })
      : false;

  if (html) {
    return new NextResponse(renderHtml(success), {
      status: success ? 200 : 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return success
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
}

export async function GET(request: Request) {
  return handle(request, true);
}

export async function POST(request: Request) {
  return handle(request, false);
}
