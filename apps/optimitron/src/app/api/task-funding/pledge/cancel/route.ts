import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { getTaskPath } from "@/lib/routes";
import { cancelPledgeAsPledger } from "@/lib/task-funding/escrow.server";
import { verifyPledgeCancelToken } from "@/lib/task-funding/pledge-cancel-token";
import { getBaseUrl } from "@/lib/url";

/**
 * GET because it is an email link: the signed token in the pledge
 * confirmation email lands here, no session required. Valid + still
 * cancellable -> pledge CANCELLED, card detached, redirect to the task's
 * funding section with ?pledge_cancelled=1. Charging already started or the
 * pledge already left ACTIVE -> nothing changes, redirect with
 * ?pledge_cancel_unavailable=1. All state transitions happen inside
 * withTaskFundingLock (see cancelPledgeAsPledger).
 */

export const runtime = "nodejs";

const log = createLogger("task-funding-pledge-cancel");

// Standalone text/html outside globals.css scope, same pattern as
// /api/email/unsubscribe: treaty palette declared once at :root.
function errorHtml(message: string, status: number) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Cancel pledge — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>:root { --treaty-paper: #ffffff; --treaty-ink: #000000; }</style>
</head>
<body style="margin:0;padding:0;background:var(--treaty-paper);font-family:Arial,sans-serif;color:var(--treaty-ink);">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:var(--treaty-paper);border:2px solid var(--treaty-ink);">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;text-transform:uppercase;">Cancel pledge</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${message}</p>
  </main>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const pledgeId = verifyPledgeCancelToken(token);
  if (!pledgeId) {
    // Static copy only — never echo the token back into HTML.
    return errorHtml("This cancel link is not valid.", 400);
  }

  try {
    const result = await cancelPledgeAsPledger(pledgeId);
    if (result.outcome === "not_found") {
      return errorHtml(
        "This pledge no longer exists. Your card will not be charged for it.",
        404,
      );
    }
    const param =
      result.outcome === "cancelled"
        ? "pledge_cancelled=1"
        : "pledge_cancel_unavailable=1";
    return NextResponse.redirect(
      `${getBaseUrl()}${getTaskPath(result.taskId)}?${param}#funding`,
      303,
    );
  } catch (error) {
    log.error("Pledge cancel failed", { error, pledgeId });
    return errorHtml(
      "Something went wrong. Your pledge was not changed. Try the link again in a minute.",
      500,
    );
  }
}
