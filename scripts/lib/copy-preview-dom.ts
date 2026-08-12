/**
 * copy-preview-dom.ts
 *
 * Browser-side DOM -> markdown walker shared by every copy-snapshot script:
 *   - packages/web/scripts/render-pages-to-markdown.ts (the monolith app)
 *   - scripts/copy-snapshot-site-apps.mjs (the split apps/ sites)
 *
 * This function is handed to Playwright's `page.evaluate`, so it must stay
 * self-contained: no imports, no closure variables, DOM APIs only.
 */
export function extractVisibleCopyMarkdown(): string {
  // tsx/esbuild injects __name(...) wrappers for named functions/arrows.
  // Shim it inside page.evaluate so those calls resolve in the browser.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as unknown as {
    __name?: (t: unknown, n: string) => unknown;
  };
  if (typeof w.__name === "undefined") {
    w.__name = (target, value) =>
      Object.defineProperty(target as object, "name", {
        value,
        configurable: true,
      });
  }
  const root = document.querySelector("main") ?? document.body;
  // Replace every `[data-volatile]` subtree with a deterministic placeholder
  // so wall-clock counters, DB-derived counts, and async-loading fallbacks
  // don't show up as diff noise in the generated markdown.
  for (const el of Array.from(root.querySelectorAll("[data-volatile]"))) {
    const label = el.getAttribute("data-volatile")?.trim() || "volatile";
    el.replaceChildren(document.createTextNode(`[${label}]`));
  }
  const tags =
    "h1,h2,h3,h4,h5,h6,p,li,button,a,blockquote,td,th,figcaption,summary,label,span,pre,table";
  const tagSet = new Set(tags.split(","));
  // Responsive duplication is a common Tailwind pattern: `<p class="lg:hidden">`
  // pairs with `<div class="hidden lg:block">` to show one summary on mobile
  // and an expanded version on desktop. At any single viewport, exactly one
  // is visible; the other has `display: none`. The walker must respect this
  // or the snapshot reads as if both versions ship together (caught when
  // /people emitted "Public official / LY / 1 task" AND "Public official / LY"
  // AND "1 task" on adjacent lines per row × 189 rows).
  // `sr-only` is Tailwind's screen-reader-only utility — visible to assistive
  // tech, invisible to sighted readers (1px clipped box). The DonationImpact-
  // Calculator emits each slider label twice: once as a visible <label>,
  // once as `<span class="sr-only">{label}</span>` paired with the input.
  // Snapshot must respect the visual layer or the .md doubles every label.
  const SR_ONLY_PATTERN = /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:)?sr-only(?:\s|$)/;
  const isHiddenForRender = (el: Element): boolean => {
    if (el.hasAttribute("data-copy-preview-ignore")) return true;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
    if (typeof el.className === "string" && SR_ONLY_PATTERN.test(el.className)) {
      return true;
    }
    return false;
  };
  // Apply CSS text-transform so visually-uppercased text (treaty headers,
  // brutal buttons) renders uppercase in the .md, matching what the reader sees.
  const applyTransform = (text: string, el: Element): string => {
    const tt = getComputedStyle(el).textTransform;
    if (tt === "uppercase") return text.toUpperCase();
    if (tt === "lowercase") return text.toLowerCase();
    if (tt === "capitalize")
      return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    return text;
  };
  const getMarkdownHref = (el: Element): string =>
    el.getAttribute("href") ?? el.getAttribute("data-copy-preview-href") ?? "";
  const withMarkdownLink = (el: Element, inner: string): string => {
    const href = getMarkdownHref(el);
    return href && inner ? `[${inner}](${href})` : inner;
  };
  // Walk an element's descendants and produce markdown that preserves
  // hyperlinks as [text](href). ParameterValue buttons/spans expose a
  // data-copy-preview-href so source-backed values keep their source in
  // page.logged-out.md even though the live UI opens a details dialog.
  // Arrow consts (not function declarations) so tsx doesn't inject
  // __name() calls that won't resolve in the browser context.
  // Walk `el`'s children producing markdown. `allowHidden`=true bypasses the
  // sr-only/display-none filter — used as a fallback when filtering would
  // produce an empty Link (sr-only-only links carry the link's accessible
  // name; without it the leader name vanishes — see task-row overlay Link
  // at packages/web/src/components/tasks/task-row.tsx:701-708).
  const toMarkdown = (el: Element, allowHidden = false): string => {
    let buf = "";
    // Insert a space between adjacent element-emitted fragments when
    // their boundary would collapse two readable runs together. Two
    // cases: alphanumeric-to-alphanumeric (word boundary), and
    // sentence-terminator-to-alphanumeric (sibling block tags like
    // <h3>year.</h3><p>That...</p> would otherwise render "year.That").
    const appendFragment = (fragment: string) => {
      if (!fragment) return;
      if (
        buf.length > 0 &&
        (/\w$/.test(buf) || /[\].!?:;,)]$/.test(buf)) &&
        /^[\w[]/.test(fragment)
      ) {
        buf += " ";
      }
      buf += fragment;
    };
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === 3 /* TEXT_NODE */) {
        buf += applyTransform(node.textContent ?? "", el);
      } else if (node.nodeType === 1 /* ELEMENT_NODE */) {
        const child = node as Element;
        if (child.hasAttribute("data-copy-preview-ignore")) continue;
        if (!allowHidden && isHiddenForRender(child)) continue;
        if (
          child.tagName === "A" ||
          child.hasAttribute("data-copy-preview-href")
        ) {
          let inner = toMarkdown(child, allowHidden)
            .replace(/\s+/g, " ")
            .trim();
          // sr-only-only Link: fall back to unfiltered inner so the accessible
          // name still ships in the snapshot.
          if (!inner && child.children.length > 0) {
            inner = toMarkdown(child, true).replace(/\s+/g, " ").trim();
          }
          appendFragment(withMarkdownLink(child, inner));
        } else {
          appendFragment(toMarkdown(child, allowHidden));
        }
      }
    }
    return buf;
  };
  // Render an HTML <table> as a GFM markdown table. First row becomes the
  // header line; if it's all <td> with no <th>, we still treat it as the
  // header — markdown requires a divider row regardless.
  const tableToMarkdown = (table: Element): string => {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return "";
    const cellsForRow = (tr: Element): string[] =>
      Array.from(tr.querySelectorAll("th,td")).map((cell) => {
        const text = toMarkdown(cell).replace(/\s+/g, " ").trim();
        // Escape pipes inside cells so they don't break the table syntax.
        return text.replace(/\|/g, "\\|") || " ";
      });
    const headerCells = cellsForRow(rows[0]!);
    if (headerCells.length === 0) return "";
    const headerLine = `| ${headerCells.join(" | ")} |`;
    const dividerLine = `| ${headerCells.map(() => "---").join(" | ")} |`;
    const bodyLines = rows
      .slice(1)
      .map((tr) => `| ${cellsForRow(tr).join(" | ")} |`);
    return [headerLine, dividerLine, ...bodyLines].join("\n");
  };
  // Layout tables (role="presentation") are not data — they're spacing
  // shims, common in email HTML and the occasional page card. Walk
  // descendants as a flat content sequence instead of rendering as a
  // markdown table.
  const isLayoutTable = (el: Element): boolean =>
    el.tagName === "TABLE" && el.getAttribute("role") === "presentation";
  const isLayoutTableCell = (el: Element): boolean => {
    const tag = el.tagName.toLowerCase();
    if (tag !== "td" && tag !== "th") return false;
    const table = el.closest("table");
    return table ? isLayoutTable(table) : false;
  };
  // Skip an element if it's inside a containing tag the walker will also
  // visit (e.g. an <a> inside a <p>): the parent's markdown already
  // includes the [text](href) form, so the standalone visit would be a dup.
  // Layout tables (and their cells) don't count as a containing tag — their
  // children should be captured as their own bullets.
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
  const seen = new Set<string>();
  const out: string[] = [];
  // Also need to check ancestors — an element can be display:flex itself
  // while sitting inside a `display: none` parent (e.g. the desktop variant
  // of a responsive pair). querySelectorAll returns it but it isn't visible.
  const hasHiddenAncestor = (el: Element): boolean => {
    let p: Element | null = el;
    while (p && p !== root) {
      if (isHiddenForRender(p)) return true;
      p = p.parentElement;
    }
    return false;
  };
  for (const el of Array.from(root.querySelectorAll(tags))) {
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
    } else if (tag === "a" || el.hasAttribute("data-copy-preview-href")) {
      let inner = toMarkdown(el).replace(/\s+/g, " ").trim();
      if (!inner && el.children.length > 0) {
        inner = toMarkdown(el, true).replace(/\s+/g, " ").trim();
      }
      md = withMarkdownLink(el, inner);
    } else {
      md = toMarkdown(el).replace(/\s+/g, " ").trim();
    }
    if (!md || md.length < 2) continue;
    if (seen.has(md)) continue;
    seen.add(md);
    const headerLevel = tag.match(/^h([1-6])$/)?.[1];
    const prefix = headerLevel
      ? `${"#".repeat(Math.min(6, Number(headerLevel) + 1))} `
      : tag === "table"
        ? ""
        : "- ";
    if (tag === "table") {
      if (out.length > 0 && out.at(-1) !== "") out.push("");
      out.push(md, "");
    } else {
      out.push(prefix + md);
    }
  }
  return out.join("\n");
}
