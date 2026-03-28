/**
 * Markdown-to-HTML renderer for chat messages.
 * Ported from transmit's renderMarkdown() in chat-widget.js.
 *
 * Returns an HTML string. Used with dangerouslySetInnerHTML since
 * the content comes from our own LLM, not user input.
 */

/**
 * Render LaTeX as a placeholder span that KaTeX can process client-side.
 * If KaTeX is not loaded yet, we emit a data-tex placeholder.
 */
function renderLatex(tex: string, display: boolean): string {
  const cls = display
    ? "chat-latex-pending chat-latex-display"
    : "chat-latex-pending";
  return (
    `<span class="${cls}" data-tex="${tex.replace(/"/g, "&quot;")}">` +
    (display ? `$$${tex}$$` : `$${tex}$`) +
    "</span>"
  );
}

export function renderMarkdown(text: string): string {
  const placeholders: string[] = [];
  function ph(html: string): string {
    const id = `\x00PH${placeholders.length}\x00`;
    placeholders.push(html);
    return id;
  }

  // 1. Extract fenced code blocks
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code: string) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return ph(`<pre class="chat-codeblock"><code>${escaped}</code></pre>`);
  });

  // 2. Extract inline code
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return ph(`<code class="chat-inline-code">${escaped}</code>`);
  });

  // 3. Extract display LaTeX ($$...$$)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, tex: string) => {
    return ph(renderLatex(tex.trim(), true));
  });

  // 4. Extract inline LaTeX ($...$) — require backslash command to skip dollar amounts
  text = text.replace(/\$([^$]+?)\$/g, (match, tex: string) => {
    if (!/\\[a-zA-Z]/.test(tex)) return match;
    return ph(renderLatex(tex, false));
  });

  // 5. HTML escape
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 6. Headers
  escaped = escaped.replace(/^#### (.+)$/gm, '<div class="chat-h4">$1</div>');
  escaped = escaped.replace(/^###? (.+)$/gm, '<div class="chat-h3">$1</div>');

  // 7. Blockquotes
  escaped = escaped.replace(
    /^&gt; (.+)$/gm,
    '<div class="chat-blockquote">$1</div>'
  );

  // 8. Bullet lists
  escaped = escaped.replace(/((?:^|\n)[-*] [^\n]+)+/g, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => "<li>" + line.replace(/^[-*] /, "") + "</li>")
      .join("");
    return `<ul class="chat-list">${items}</ul>`;
  });

  // 9. Numbered lists
  escaped = escaped.replace(/((?:^|\n)\d+\. [^\n]+)+/g, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => "<li>" + line.replace(/^\d+\. /, "") + "</li>")
      .join("");
    return `<ol class="chat-list">${items}</ol>`;
  });

  // 10. Bold
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 11. Italic
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 12. Links
  escaped = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );

  // 13. Paragraphs
  escaped = escaped.replace(/\n\n+/g, "</p><p>");
  escaped = escaped.replace(/\n/g, "<br>");

  // 14. Re-insert placeholders
  for (let i = 0; i < placeholders.length; i++) {
    escaped = escaped.replace(`\x00PH${i}\x00`, placeholders[i]!);
  }

  return `<p>${escaped}</p>`;
}
