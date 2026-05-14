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
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SETTINGS_HREF = "/settings#email-preferences";

// Treaty palette declared inline because this route returns standalone
// `text/html` that doesn't share Next.js' globals.css scope. CLAUDE.md bans
// raw hex literals in browser-rendered surfaces; defining the variables
// once at `:root` lets the rest of the doc reference them through
// `var(--treaty-*)`.
const TREATY_STYLE_BLOCK = `<style>
  :root {
    --treaty-paper: #ffffff;
    --treaty-ink: #000000;
    --treaty-page-bg: #f4f4f5;
    --treaty-error-ink: #991b1b;
  }
</style>`;

interface ParsedRequest {
  userId: string;
  scope: EmailScope;
  emailLogId: string | null;
  token: string;
  action: "unsubscribe" | "resubscribe";
}

interface ParsedBody {
  form: URLSearchParams | null;
  oneClickUnsubscribe: boolean;
}

async function parseFormBody(request: Request): Promise<ParsedBody> {
  if (request.method !== "POST") {
    return { form: null, oneClickUnsubscribe: false };
  }

  // RFC 8058 §3 lists BOTH `application/x-www-form-urlencoded` and
  // `multipart/form-data` as acceptable content types for one-click
  // unsubscribe POSTs. Mailbox providers in the wild use either —
  // we have to accept both or some senders' one-click links 400.
  // (PR #79 Codex review caught this regression.)
  const contentType = request.headers.get("content-type") ?? "";
  let form: URLSearchParams | null = null;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    form = new URLSearchParams(await request.text());
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    form = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      // Skip File entries — unsubscribe params are all string-valued.
      if (typeof value === "string") form.append(key, value);
    }
  }

  if (!form) {
    return { form: null, oneClickUnsubscribe: false };
  }

  return {
    form,
    oneClickUnsubscribe: form.get("List-Unsubscribe") === "One-Click",
  };
}

function parseParams(
  request: Request,
  body: URLSearchParams | null,
): ParsedRequest | { error: string; status: number } {
  const url = new URL(request.url);
  const query = url.searchParams;

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

async function getRecipientEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email?.trim().toLowerCase() || null;
}

function renderErrorHtml(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
${TREATY_STYLE_BLOCK}
</head>
<body style="margin:0;padding:0;background:var(--treaty-page-bg);font-family:Arial,sans-serif;color:var(--treaty-ink);">
  <main style="max-width:560px;margin:60px auto;padding:32px 20px;background:var(--treaty-paper);border:3px solid var(--treaty-ink);">
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;text-transform:uppercase;">Unsubscribe failed</h1>
    <p style="margin:0;font-size:15px;line-height:1.5;">${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}

function renderPromptHtml(input: {
  userId: string;
  scope: EmailScope;
  emailLogId: string | null;
  action: "unsubscribe" | "resubscribe";
  error?: string;
}): string {
  const scopeLabel = EMAIL_SCOPES[input.scope].label;
  const isUnsub = input.action === "unsubscribe";
  const headline = isUnsub ? "Confirm unsubscribe" : "Confirm resubscribe";
  const button = isUnsub ? "Unsubscribe" : "Resubscribe";
  const formAction = buildUnsubscribeUrl({
    userId: input.userId,
    scope: input.scope,
    emailLogId: input.emailLogId ?? undefined,
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
${TREATY_STYLE_BLOCK}
</head>
<body style="margin:0;padding:0;background:var(--treaty-paper);font-family:Arial,sans-serif;color:var(--treaty-ink);">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:var(--treaty-paper);border:2px solid var(--treaty-ink);">
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;line-height:1.1;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      This changes the <strong>${escapeHtml(scopeLabel)}</strong> email setting for the human who received the email. If the email was forwarded to you, this is not your switch.
    </p>
    ${input.error ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;font-weight:700;color:var(--treaty-error-ink);">${escapeHtml(input.error)}</p>` : ""}
    <form method="POST" action="${escapeHtml(formAction)}" style="margin:0 0 16px;">
      <input type="hidden" name="action" value="${input.action}" />
      <label for="confirmEmail" style="display:block;margin:0 0 8px;font-size:13px;line-height:1.4;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Recipient email</label>
      <input id="confirmEmail" name="confirmEmail" type="email" autocomplete="email" required placeholder="name@example.com" style="display:block;width:100%;box-sizing:border-box;margin:0 0 16px;padding:12px 14px;border:2px solid var(--treaty-ink);font-size:16px;line-height:1.4;color:var(--treaty-ink);background:var(--treaty-paper);" />
      <button type="submit" style="cursor:pointer;display:inline-block;background:var(--treaty-ink);color:var(--treaty-paper);padding:12px 20px;text-decoration:none;font-weight:900;border:2px solid var(--treaty-ink);font-size:14px;letter-spacing:.05em;text-transform:uppercase;">${escapeHtml(button)}</button>
    </form>
    <p style="margin:0;font-size:12px;line-height:1.5;">
      <a href="${SETTINGS_HREF}" style="color:var(--treaty-ink);font-weight:700;">Manage all email preferences</a>
    </p>
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
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Unsubscribe — Optimitron</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
${TREATY_STYLE_BLOCK}
</head>
<body style="margin:0;padding:0;background:var(--treaty-paper);font-family:Arial,sans-serif;color:var(--treaty-ink);">
  <main style="max-width:560px;margin:60px auto;padding:32px 24px;background:var(--treaty-paper);border:2px solid var(--treaty-ink);">
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;line-height:1.1;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${body}</p>
    <p style="margin:0;font-size:12px;line-height:1.5;">
      <a href="${SETTINGS_HREF}" style="color:var(--treaty-ink);font-weight:700;">Manage all email preferences</a>
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

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function applyPreferenceChange(input: {
  parsed: ParsedRequest;
  via: UnsubscribeVia;
}) {
  if (input.parsed.action === "resubscribe") {
    await applyResubscribe({
      userId: input.parsed.userId,
      scope: input.parsed.scope,
      emailLogId: input.parsed.emailLogId,
      via: input.via,
    });
  } else {
    await applyUnsubscribe({
      userId: input.parsed.userId,
      scope: input.parsed.scope,
      emailLogId: input.parsed.emailLogId,
      via: input.via,
    });
  }
}

async function handle(request: Request) {
  const body = await parseFormBody(request);
  const parsed = parseParams(request, body.form);
  if ("error" in parsed) {
    return request.method === "GET"
      ? htmlResponse(renderErrorHtml(parsed.error), parsed.status)
      : NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  if (request.method === "GET") {
    return htmlResponse(renderPromptHtml(parsed));
  }

  const via: UnsubscribeVia = "POST";
  try {
    if (body.oneClickUnsubscribe) {
      await applyPreferenceChange({
        parsed: { ...parsed, action: "unsubscribe" },
        via,
      });
      return new NextResponse(null, { status: 204 });
    }

    const confirmedEmail = body.form?.get("confirmEmail")?.trim().toLowerCase();
    const recipientEmail = await getRecipientEmail(parsed.userId);
    if (!recipientEmail) {
      return htmlResponse(
        renderErrorHtml("We could not find the recipient for this link."),
        404,
      );
    }
    if (!confirmedEmail || confirmedEmail !== recipientEmail) {
      return htmlResponse(
        renderPromptHtml({
          ...parsed,
          error:
            "That email address does not match the person this link belongs to.",
        }),
        400,
      );
    }

    await applyPreferenceChange({ parsed, via });
  } catch (error) {
    const { token: _token, ...safeParsed } = parsed;
    console.error("[UNSUBSCRIBE] Failed to apply", safeParsed, error);
    return htmlResponse(renderErrorHtml("Something went wrong. Please try again."), 500);
  }

  const state = await getEmailSuppressionStateForUser(parsed.userId);
  const masterSuppressed = state ? isMasterSuppressed(state) : false;
  const scopeEnabled = state ? isSendAllowed(parsed.scope, state) : false;
  return htmlResponse(
    renderConfirmationHtml({
      ...parsed,
      masterSuppressed,
      scopeEnabled,
    }),
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
