/**
 * Task text can arrive from form fields, JSON APIs, or MCP clients. Some clients
 * send literal "\n" / "\\n" sequences instead of newline characters, which makes
 * markdown render those escape sequences visibly. Normalize at task boundaries
 * so markdown, summaries, and reminder text all see real line breaks.
 */
export function normalizeTaskTextLineBreaks(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\\+r\\+n|\\+n/g, (match, offset, source) =>
      isLikelyFilePathToken(source, offset, match.length) ? match : "\n",
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
  const tokenBeforeMatch = source.slice(whitespaceStart + 1, offset);

  return /^(?:[A-Za-z]:|\\\\[^\\/\s]+)(?:[\\/][^\\/\s]+)*$/.test(
    tokenBeforeMatch,
  );
}
