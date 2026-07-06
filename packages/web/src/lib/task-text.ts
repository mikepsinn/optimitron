/**
 * Task text can arrive from form fields, JSON APIs, or MCP clients. Some clients
 * send literal "\n" / "\\n" sequences instead of newline characters, which makes
 * markdown render those escape sequences visibly. Normalize at task boundaries
 * so markdown, summaries, and reminder text all see real line breaks.
 */
export function normalizeTaskTextLineBreaks(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\\+r\\+n|\\+n/g, (match, offset, source) => {
      if (
        isInsideBacktickCode(source, offset) ||
        isLikelyLiteralEscape(source, offset, match.length) ||
        isLikelyFilePathToken(source, offset, match.length)
      ) {
        return match;
      }

      return isLikelyMarkdownLineBreak(source, offset, match.length)
        ? "\n"
        : match;
    });
}

function isLikelyMarkdownLineBreak(
  source: string,
  offset: number,
  matchLength: number,
) {
  const previous = source[offset - 1] ?? "";
  const next = source[offset + matchLength] ?? "";
  const nextNonSpace = source.slice(offset + matchLength).match(/\S/)?.[0] ?? "";

  return (
    next === "\\" ||
    /^[A-Z0-9#>*+-]$/.test(nextNonSpace) ||
    (/\w/.test(previous) && /\w/.test(next))
  );
}

function isInsideBacktickCode(source: string, offset: number) {
  const before = source.slice(0, offset);
  let inFence = false;
  let inlineBackticks = 0;

  for (const line of before.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const inlineTicks = line.match(/`+/g) ?? [];
    for (const ticks of inlineTicks) {
      inlineBackticks = inlineBackticks === ticks.length ? 0 : ticks.length;
    }
  }

  return inFence || inlineBackticks > 0;
}

function isLikelyLiteralEscape(
  source: string,
  offset: number,
  matchLength: number,
) {
  const previous = source[offset - 1] ?? "";
  const next = source[offset + matchLength] ?? "";
  const previousNonSpace = source.slice(0, offset).match(/\S(?=\s*$)/)?.[0] ?? "";
  const nextNonSpace = source.slice(offset + matchLength).match(/\S/)?.[0] ?? "";

  if (
    (previous === "\"" && next === "\"") ||
    (previous === "'" && next === "'") ||
    (previous === "/" && next === "/")
  ) {
    return true;
  }

  return (
    (!previousNonSpace || /[\s([{:=,]/.test(previousNonSpace)) &&
    (!nextNonSpace || /[\s)\]},.;:]/.test(nextNonSpace))
  );
}

function isLikelyFilePathToken(
  source: string,
  offset: number,
  matchLength: number,
) {
  const next = source[offset + matchLength] ?? "";
  if (!/[A-Za-z0-9_.-]/.test(next)) return false;

  const whitespaceStart = Math.max(
    source.lastIndexOf(" ", offset - 1),
    source.lastIndexOf("\n", offset - 1),
    source.lastIndexOf("\t", offset - 1),
  );
  const tokenBeforeMatch = source
    .slice(whitespaceStart + 1, offset)
    .replace(/^[`([{<"']+/, "");

  return /^(?:[A-Za-z]:|\\\\[^\\/\s]+)(?:[\\/][^\\/\s]+)*$/.test(
    tokenBeforeMatch,
  );
}
