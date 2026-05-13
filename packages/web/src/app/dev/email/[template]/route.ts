import { NextResponse } from "next/server";
import {
  buildFullPreviewHtml,
  renderPreviewBodyHtml,
} from "@/lib/email/preview-envelope";
import {
  getEmailPreview,
  listEmailPreviewTemplateIds,
} from "@/lib/email/preview-registry";

// `/dev/email/<template>` — server-side renders each email template with
// representative sample tokens and returns the raw HTML. Templates +
// their envelope metadata live in `@/lib/email/preview-registry`, which
// pulls each builder file's `*_PREVIEW` const into one iterable.
//
// Query params:
//   ?raw=1   — bare HTML body (used by the Playwright screenshot spec).
//   ?full=1  — wrap with metadata header (From/Subject/Reply-To/Trigger),
//              substitute the unsub-URL placeholder, append the Wishonia
//              signature (when not skipped), and tack on an unsubscribe
//              footer. Used by `render-emails-to-markdown.ts`.
//   default  — Gmail-mobile responsive wrapper around the bare body.
//
// Gated to non-production: returns 404 on prod to avoid exposing email
// internals + sample copy publicly.

function escapeForSrcdoc(html: string): string {
  return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function buildMobilePreviewWrapper(template: string, emailHtml: string): string {
  const safe = escapeForSrcdoc(emailHtml);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>Email preview: ${template}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f5f5f5; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .toolbar { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 10px 16px; font-size: 13px; color: #5f6368; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .toolbar strong { color: #202124; }
  .toolbar a { color: #1a73e8; text-decoration: none; }
  .toolbar a:hover { text-decoration: underline; }
  .gmail-frame { max-width: 420px; margin: 12px auto; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; }
  .gmail-frame iframe { width: 100%; height: 80vh; border: 0; display: block; background: #fff; }
  @media (min-width: 640px) {
    .gmail-frame { max-width: 420px; margin: 24px auto; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>Email preview · <strong>${template}</strong> · Gmail-mobile width (420px)</span>
  <a href="?raw=1">view raw HTML →</a>
</div>
<div class="gmail-frame">
  <iframe srcdoc="${safe}" title="${template}"></iframe>
</div>
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ template: string }> },
) {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { template } = await params;
  const preview = getEmailPreview(template);
  if (!preview) {
    const available = listEmailPreviewTemplateIds().join(", ");
    return new NextResponse(
      `Unknown email template: "${template}". Available: ${available}`,
      { status: 404, headers: { "content-type": "text/plain" } },
    );
  }

  const url = new URL(request.url);
  const wantsRaw = url.searchParams.get("raw") === "1";
  const wantsFull = url.searchParams.get("full") === "1";

  const html = wantsFull
    ? await buildFullPreviewHtml(preview)
    : await renderPreviewBodyHtml(preview);
  const body = wantsRaw ? html : buildMobilePreviewWrapper(template, html);
  return new NextResponse(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
