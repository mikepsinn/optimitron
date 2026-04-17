import { NextResponse } from "next/server";
import {
  getEmailSuppressionStateForUser,
  isMasterSuppressed,
  isSendAllowed,
} from "@/lib/email/can-send.server";
import {
  EMAIL_SCOPES,
  isEmailScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";
import {
  applyResubscribe,
  applyUnsubscribe,
  type UnsubscribeVia,
} from "@/lib/email/suppression.server";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import { verifyUnsubToken } from "@/lib/email/unsub-token";

export const runtime = "nodejs";

const SETTINGS_HREF = "/settings#email-preferences";

interface ParsedRequest {
  userId: string;
  scope: EmailScope;
  emailLogId: string | null;
  token: string;
  action: "unsubscribe" | "resubscribe";
}

async function parseParams(request: Request): Promise<ParsedRequest | { error: string; status: number }> {
  const url = new URL(request.url);
  const query = url.searchParams;

  // POST may carry the one-click body per RFC 8058.
  let body: URLSearchParams | null = null;
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      body = new URLSearchParams(await request.text());
    }
  }

  const userId = query.get("u") ?? body?.get("u") ?? "";
  const scopeRaw = query.get("s") ?? body?.get("s") ?? "";
  const token = query.get("t") ?? body?.get("t") ?? "";
  const emailLogId = query.get("em") ?? body?.get("em") ?? null;
  const actionRaw = query.get("action") ?? body?.get("action") ?? "unsubscribe";

  if (!userId || !scopeRaw || !token) {
    return { error: "Missing required parameters.", status: 400 };
  }

  if (!isEmailScope(scopeRaw)) {
    return { error: "Unknown scope.", status: 400 };
  }

  if (isTransactionalScope(scopeRaw)) {
    return { error: "This email type cannot be unsubscribed from.", status: 400 };
  }

  const action = actionRaw === "resubscribe" ? "resubscribe" : "unsubscribe";

  const payload = { userId, scope: scopeRaw, emailLogId: emailLogId ?? undefined };
  if (!verifyUnsubToken(payload, token)) {
    return { error: "Invalid or expired unsubscribe link.", status: 400 };
  }

  return { userId, scope: scopeRaw, emailLogId, token, action };
}

function renderErrorHtml(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <main style="max-width:560px;margin:60px auto;padding:32px 20px;background:#ffffff;border:3px solid #111827;">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;text-transform:uppercase;">Unsubscribe failed</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}

function renderConfirmationHtml(input: {
  userId: string;
  scope: EmailScope;
  emailLogId: string | null;
  action: "unsubscribe" | "resubscribe";
  masterSuppressed: boolean;
  scopeEnabled: boolean;
}): string {
  const scopeLabel = EMAIL_SCOPES[input.scope].label;
  const isUnsub = input.action === "unsubscribe";
  const headline = isUnsub
    ? "You have been unsubscribed"
    : input.scopeEnabled
      ? "You have been resubscribed"
      : "Scope saved, but all non-essential email is still off";
  const body = isUnsub
    ? `You will no longer receive <strong>${escapeHtml(scopeLabel)}</strong>. Transactional mail (sign-in links, security alerts) will still be delivered.`
    : input.scopeEnabled
      ? `You are subscribed again to <strong>${escapeHtml(scopeLabel)}</strong>.`
      : `We removed the individual block for <strong>${escapeHtml(scopeLabel)}</strong>, but your master opt-out is still active. Turn non-essential email back on in Settings to receive it.`;
  const toggleLabel = isUnsub ? "Resubscribe" : "Unsubscribe";
  const toggleAction = isUnsub ? "resubscribe" : "unsubscribe";
  const formAction = buildUnsubscribeUrl({
    userId: input.userId,
    scope: input.scope,
    emailLogId: input.emailLogId ?? undefined,
  });
  const showToggle = !(input.action === "resubscribe" && input.masterSuppressed && !input.scopeEnabled);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111827;">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:#FFE66D;border:3px solid #111827;box-shadow:8px 8px 0px 0px rgba(0,0,0,1);">
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;line-height:1.1;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${body}</p>
    ${showToggle ? `<form method="POST" action="${escapeHtml(formAction)}" style="margin:0 0 12px;">
      <input type="hidden" name="action" value="${toggleAction}" />
      <button type="submit" style="cursor:pointer;display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;text-decoration:none;font-weight:900;border:3px solid #111827;font-size:14px;letter-spacing:.05em;text-transform:uppercase;">${escapeHtml(toggleLabel)}</button>
    </form>` : ""}
    <p style="margin:0;font-size:12px;line-height:1.5;">
      <a href="${SETTINGS_HREF}" style="color:#111827;font-weight:700;">Manage all email preferences →</a>
    </p>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function handle(request: Request, respondWithHtml: boolean) {
  const parsed = await parseParams(request);
  if ("error" in parsed) {
    return respondWithHtml
      ? new NextResponse(renderErrorHtml(parsed.error), {
          status: parsed.status,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const via: UnsubscribeVia = request.method === "POST" ? "POST" : "GET";
  try {
    if (parsed.action === "resubscribe") {
      await applyResubscribe({
        userId: parsed.userId,
        scope: parsed.scope,
        emailLogId: parsed.emailLogId,
        via,
      });
    } else {
      await applyUnsubscribe({
        userId: parsed.userId,
        scope: parsed.scope,
        emailLogId: parsed.emailLogId,
        via,
      });
    }
  } catch (error) {
    console.error("[UNSUBSCRIBE] Failed to apply", parsed, error);
    return respondWithHtml
      ? new NextResponse(renderErrorHtml("Something went wrong. Please try again."), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
      : NextResponse.json({ error: "Internal error." }, { status: 500 });
  }

  if (respondWithHtml) {
    const state = await getEmailSuppressionStateForUser(parsed.userId);
    const masterSuppressed = state ? isMasterSuppressed(state) : false;
    const scopeEnabled = state ? isSendAllowed(parsed.scope, state) : false;
    return new NextResponse(renderConfirmationHtml({
      ...parsed,
      masterSuppressed,
      scopeEnabled,
    }), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: Request) {
  return handle(request, /* respondWithHtml */ true);
}

export async function POST(request: Request) {
  return handle(request, /* respondWithHtml */ false);
}
