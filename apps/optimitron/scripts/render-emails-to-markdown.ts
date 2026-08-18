#!/usr/bin/env tsx
/**
 * render-emails-to-markdown.ts
 *
 * Generate `.email.md` snapshots for each outbound email template, alongside
 * the email source files in `src/lib/email/` and `src/lib/tasks/`.
 *
 * Pulls the list of templates + envelope metadata (subject, From, Reply-To,
 * skip-Wishonia flag, trigger description, scope) from
 * `@/lib/email/preview-registry`, which itself aggregates per-template
 * `*_PREVIEW` consts colocated with each `build*Html` builder.
 *
 * Each `<slug>.email.md` includes the rendered envelope (From / Subject /
 * Reply-To / Trigger / Scope) at the top so reviewers see WHEN the email
 * fires + WHAT triggers it without grepping the send sites.
 *
 * Usage:
 *   pnpm --filter @optimitron/web email:preview-md
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_PREVIEWS } from "../src/lib/email/preview-registry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const EMAIL_LIB_DIR = path.resolve(WEB_ROOT, "src/lib/email");
const TASK_LIB_DIR = path.resolve(WEB_ROOT, "src/lib/tasks");

const BASE = process.env.PREVIEW_BASE_URL ?? "http://127.0.0.1:3001";

// `assertEmailSafe` (resend.ts) rejects any outbound email body containing
// `localhost` or `127.0.0.1`. The dev preview origin embeds those literals
// in `getBaseUrl()`-derived absolute URLs (e.g. the `[1% Treaty]` link in
// the post-vote share email). Committed snapshots that still contain them
// mislead reviewers — the rendered markdown then shows URLs the recipient
// will literally never see. We rewrite captured loopback origins to the
// production canonical so the snapshots match what ships.
const CANONICAL_BASE = process.env.PREVIEW_CANONICAL_BASE_URL ??
  "https://warondisease.org";
// Lookahead requires a URL boundary char (or end of string) after the
// loopback origin so we don't partial-match longer hostnames like
// `localhostfoo.example.com`.
const LOOPBACK_ORIGIN_RX =
  /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?=[/:?#"'\s)\\]]|$)/gi;

function canonicalizeLoopbackUrls(body: string): string {
  return body.replace(LOOPBACK_ORIGIN_RX, CANONICAL_BASE);
}

// Map each preview's templateId to the directory where its
// `<slug>.email.md` snapshot should land — next to the builder source.
// Templates not listed here default to EMAIL_LIB_DIR.
const TEMPLATE_OUTPUT_DIRS: Record<string, string> = {
  "task-assignment": TASK_LIB_DIR,
  "task-comment-notification": TASK_LIB_DIR,
};

function outputDirForTemplate(templateId: string): string {
  return TEMPLATE_OUTPUT_DIRS[templateId] ?? EMAIL_LIB_DIR;
}

async function extractEmailMarkdown(
  page: import("@playwright/test").Page,
  slug: string,
): Promise<string> {
  const response = await page.goto(`${BASE}/dev/email/${slug}?raw=1&full=1`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  const status = response?.status();
  if (status !== undefined && status >= 400) {
    throw new Error(`HTTP ${status} from /dev/email/${slug}`);
  }
  return await page.evaluate((canonicalBase) => {
    // tsx/esbuild injects __name(...) wrappers for named arrows; shim it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as unknown as { __name?: (t: unknown, n: string) => unknown };
    if (typeof w.__name === "undefined") {
      w.__name = (target, value) =>
        Object.defineProperty(target as object, "name", {
          value,
          configurable: true,
        });
    }
    const root = document.body;
    const skipSelector = "[data-email-headers]";
    const tags =
      "h1,h2,h3,h4,h5,h6,p,li,button,a,blockquote,td,th,figcaption,summary,label,span,pre,table";
    const tagSet = new Set(tags.split(","));
    // See render-pages-to-markdown.ts for rationale: responsive duplication
    // (Tailwind `lg:hidden` paired with `hidden lg:block`) renders both
    // copies in the DOM but only one is visible at the current viewport. The
    // walker must skip the `display: none` copy or the snapshot doubles up.
    const SR_ONLY_PATTERN = /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:)?sr-only(?:\s|$)/;
    const LOOPBACK_ORIGIN_RX =
      /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?=[/:?#"'\s)\]]|$)/gi;
    const canonicalizeHref = (href: string): string =>
      href.replace(LOOPBACK_ORIGIN_RX, canonicalBase);
    const isHiddenForRender = (el: Element): boolean => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return true;
      if (typeof el.className === "string" && SR_ONLY_PATTERN.test(el.className)) {
        return true;
      }
      return false;
    };
    const applyTransform = (text: string, el: Element): string => {
      const tt = getComputedStyle(el).textTransform;
      if (tt === "uppercase") return text.toUpperCase();
      if (tt === "lowercase") return text.toLowerCase();
      if (tt === "capitalize")
        return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
      return text;
    };
    const toMarkdown = (el: Element, allowHidden = false): string => {
      let buf = "";
      const appendFragment = (fragment: string) => {
        if (!fragment) return;
        if (
          buf.length > 0 &&
          /\w$/.test(buf) &&
          /^[\w[]/.test(fragment)
        ) {
          buf += " ";
        }
        buf += fragment;
      };
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === 3) {
          buf += applyTransform(node.textContent ?? "", el);
        } else if (node.nodeType === 1) {
          const child = node as Element;
          if (!allowHidden && isHiddenForRender(child)) continue;
          if (child.tagName === "A") {
            const href = canonicalizeHref(child.getAttribute("href") ?? "");
            let inner = toMarkdown(child, allowHidden).replace(/\s+/g, " ").trim();
            if (!inner && child.children.length > 0) {
              inner = toMarkdown(child, true).replace(/\s+/g, " ").trim();
            }
            appendFragment(href && inner ? `[${inner}](${href})` : inner);
          } else {
            appendFragment(toMarkdown(child, allowHidden));
          }
        }
      }
      return buf;
    };
    const tableToMarkdown = (table: Element): string => {
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const cellsForRow = (tr: Element): string[] =>
        Array.from(tr.querySelectorAll("th,td")).map((cell) => {
          const text = toMarkdown(cell).replace(/\s+/g, " ").trim();
          return text.replace(/\|/g, "\\|") || " ";
        });
      const headerCells = cellsForRow(rows[0]!);
      if (headerCells.length === 0) return "";
      const headerLine = `| ${headerCells.join(" | ")} |`;
      const dividerLine = `| ${headerCells.map(() => "---").join(" | ")} |`;
      const bodyLines = rows.slice(1).map(
        (tr) => `| ${cellsForRow(tr).join(" | ")} |`,
      );
      return [headerLine, dividerLine, ...bodyLines].join("\n");
    };
    const isSingleCellLayoutTable = (table: Element): boolean => {
      if (table.querySelector("th")) return false;
      const rows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > tr"));
      if (rows.length === 0) return false;
      return rows.every(
        (row) => row.querySelectorAll(":scope > td, :scope > th").length <= 1,
      );
    };
    const isLayoutTable = (el: Element): boolean =>
      el.tagName === "TABLE" &&
      (el.getAttribute("role") === "presentation" ||
        isSingleCellLayoutTable(el));
    const isLayoutTableCell = (el: Element): boolean => {
      const tag = el.tagName.toLowerCase();
      if (tag !== "td" && tag !== "th") return false;
      const table = el.closest("table");
      return table ? isLayoutTable(table) : false;
    };
    const hasContainingTag = (el: Element): boolean => {
      let p = el.parentElement;
      while (p && p !== root) {
        if (
          tagSet.has(p.tagName.toLowerCase()) &&
          !isLayoutTable(p) &&
          !isLayoutTableCell(p)
        )
          return true;
        p = p.parentElement;
      }
      return false;
    };
    const hasHiddenAncestor = (el: Element): boolean => {
      let p: Element | null = el;
      while (p && p !== root) {
        if (isHiddenForRender(p)) return true;
        p = p.parentElement;
      }
      return false;
    };
    type Block = { kind: "list" | "block"; text: string };
    const seen = new Set<string>();
    const out: Block[] = [];
    for (const el of Array.from(root.querySelectorAll(tags))) {
      if (el.closest(skipSelector)) continue;
      if (isLayoutTableCell(el)) continue;
      if (hasContainingTag(el)) continue;
      if (hasHiddenAncestor(el)) continue;
      const tag = el.tagName.toLowerCase();
      let md: string;
      if (tag === "table") {
        if (isLayoutTable(el)) continue;
        md = tableToMarkdown(el);
      } else if (tag === "pre") {
        const text = (el as HTMLElement).innerText.trim();
        md = text ? `\`\`\`text\n${text}\n\`\`\`` : "";
      } else if (tag === "a") {
        const href = canonicalizeHref(el.getAttribute("href") ?? "");
        let inner = toMarkdown(el).replace(/\s+/g, " ").trim();
        if (!inner && el.children.length > 0) {
          inner = toMarkdown(el, true).replace(/\s+/g, " ").trim();
        }
        md = href && inner ? `[${inner}](${href})` : inner;
      } else {
        md = toMarkdown(el).replace(/\s+/g, " ").trim();
      }
      if (!md || md.length < 2) continue;
      if (seen.has(md)) continue;
      seen.add(md);
      const headerLevel = tag.match(/^h([1-6])$/)?.[1];
      // Emails read as prose, not as a copy inventory. Use `- ` only
      // for genuine list items (<li>). Paragraphs, anchors, standalone
      // buttons render as plain lines; headings get `### `; tables
      // render their own markdown syntax already.
      const prefix = headerLevel
        ? `${"#".repeat(Math.min(6, Number(headerLevel) + 1))} `
        : tag === "li"
          ? "- "
          : "";
      out.push({ kind: tag === "li" ? "list" : "block", text: prefix + md });
    }
    const lines: string[] = [];
    let previousKind: Block["kind"] | null = null;
    for (const block of out) {
      if (lines.length > 0) {
        if (!(previousKind === "list" && block.kind === "list")) {
          lines.push("");
        }
      }
      lines.push(block.text);
      previousKind = block.kind;
    }
    return lines.join("\n");
  }, CANONICAL_BASE);
}

function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "<br>");
}

function renderEnvelopeMarkdown(
  preview: (typeof EMAIL_PREVIEWS)[number],
): string {
  const rows = [
    ["From", preview.from()],
    ["Subject", preview.subject()],
    ...(preview.replyTo ? [["Reply-To", preview.replyTo()]] : []),
    ["Trigger", preview.trigger],
    ["Scope", preview.scope],
    ["Wishonia signature", preview.skipWishoniaSignature ? "Skipped" : "Appended"],
  ] as Array<[string, string]>;

  return [
    "| Field | Value |",
    "| --- | --- |",
    ...rows.map(
      ([field, value]) =>
        `| ${escapeMarkdownTableCell(field)} | ${escapeMarkdownTableCell(value)} |`,
    ),
  ].join("\n");
}

async function main() {
  const browser = await chromium.launch();
  let failures = 0;
  try {
    const ctx = await browser.newContext({
      viewport: { width: 800, height: 1200 },
    });
    const page = await ctx.newPage();
    try {
      for (const preview of EMAIL_PREVIEWS) {
        const dir = outputDirForTemplate(preview.templateId);
        const outPath = path.join(dir, `${preview.templateId}.email.md`);
        try {
          const rawBody = await extractEmailMarkdown(page, preview.templateId);
          const body = canonicalizeLoopbackUrls(rawBody);
          const header = [
            "<!--",
            "  AUTO-GENERATED by scripts/render-emails-to-markdown.ts.",
            "  Regenerate via `pnpm --filter @optimitron/web email:preview-md`.",
            `  Source: /dev/email/${preview.templateId}?raw=1&full=1`,
            "-->",
            "",
            `# ${preview.displayName}`,
            "",
            "## Envelope",
            "",
            renderEnvelopeMarkdown(preview),
            "",
            "---",
            "",
            "## Body",
            "",
            body,
            "",
          ].join("\n");
          await mkdir(dir, { recursive: true });
          await writeFile(outPath, header, "utf8");
          console.log(
            `OK ${preview.templateId}  ->  ${path.relative(WEB_ROOT, outPath)}`,
          );
        } catch (err) {
          failures += 1;
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`FAIL ${preview.templateId}  (${message})`);
        }
      }
    } finally {
      await ctx.close();
    }
    if (failures > 0) {
      throw new Error(`Email preview failed for ${failures} template(s).`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
