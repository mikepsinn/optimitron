import type { ReactNode } from "react";

/**
 * Renders the Court of Humanity case body without a markdown library.
 *
 * The body (`COURT_OF_HUMANITY_TEXT.markdown` in `@optimitron/data`) uses
 * exactly three inline constructs — paragraphs, `**bold**`, and
 * `[text](url)` links — plus `\$` dollar escapes. This renderer supports
 * exactly those. `court-case-text.test.ts` validates the canonical body
 * against this contract so a future edit that introduces new markdown
 * syntax fails the suite loudly instead of rendering as literal text.
 */

const INLINE_TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

const UNSUPPORTED_LINE_PREFIXES = ["#", "- ", "* ", "> ", "```", "|"];

export function findUnsupportedCourtMarkdown(markdown: string): string[] {
  const problems: string[] = [];
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    for (const prefix of UNSUPPORTED_LINE_PREFIXES) {
      if (line.startsWith(prefix)) {
        problems.push(`Unsupported markdown block syntax: "${line.slice(0, 40)}"`);
      }
    }
    if (line.includes("![")) {
      problems.push(`Unsupported markdown image: "${line.slice(0, 40)}"`);
    }
  }
  return problems;
}

function unescapeText(text: string): string {
  return text.replace(/\\\$/g, "$");
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(unescapeText(text.slice(lastIndex, index)));
    }
    const [, linkText, linkUrl, boldText] = match;
    if (linkText && linkUrl) {
      nodes.push(
        <a
          key={key++}
          className="text-foreground underline underline-offset-2"
          href={linkUrl}
          rel="noreferrer"
          target="_blank"
        >
          {unescapeText(linkText)}
        </a>,
      );
    } else if (boldText) {
      nodes.push(
        <strong key={key++} className="font-black text-foreground">
          {unescapeText(boldText)}
        </strong>,
      );
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(unescapeText(text.slice(lastIndex)));
  }
  return nodes;
}

export function CourtCaseText({ markdown }: { markdown: string }) {
  const paragraphs = markdown
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-base font-medium leading-relaxed text-foreground">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{renderInline(paragraph)}</p>
      ))}
    </div>
  );
}
