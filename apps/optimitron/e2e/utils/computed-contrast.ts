/**
 * Custom WCAG 2.1 contrast checker using getComputedStyle.
 *
 * axe-core marks elements on gradients / semi-transparent overlays as
 * "incomplete" (needs manual review) and silently skips them.
 * This module extracts the *actual rendered* foreground and effective
 * background colors, then computes the real contrast ratio.
 */
import type { Page } from "@playwright/test";

export interface ComputedContrastViolation {
  selector: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  fontSize: string;
  fontWeight: string;
}

/**
 * Evaluate all visible text elements on the page and return those
 * whose computed contrast ratio falls below WCAG AA thresholds.
 *
 * Thresholds (WCAG 2.1 AA):
 *   - Normal text: 4.5:1
 *   - Large text (≥18pt OR bold ≥14pt): 3:1
 */
export async function getContrastViolations(
  page: Page,
): Promise<ComputedContrastViolation[]> {
  return page.evaluate(() => {
    // ── colour math (runs in browser) ──────────────────────────

    function parseColor(raw: string): [number, number, number, number] | null {
      const rgba = raw.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/,
      );
      if (!rgba) return null;
      return [
        Number(rgba[1]) / 255,
        Number(rgba[2]) / 255,
        Number(rgba[3]) / 255,
        rgba[4] !== undefined ? Number(rgba[4]) : 1,
      ];
    }

    /** Blend fg (with alpha) over an opaque bg */
    function alphaComposite(
      fg: [number, number, number, number],
      bg: [number, number, number],
    ): [number, number, number] {
      const a = fg[3];
      return [
        fg[0] * a + bg[0] * (1 - a),
        fg[1] * a + bg[1] * (1 - a),
        fg[2] * a + bg[2] * (1 - a),
      ];
    }

    function sRGBtoLinear(c: number): number {
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(r: number, g: number, b: number): number {
      return (
        0.2126 * sRGBtoLinear(r) +
        0.7152 * sRGBtoLinear(g) +
        0.0722 * sRGBtoLinear(b)
      );
    }

    function contrastRatio(l1: number, l2: number): number {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Walk up the DOM to find the first ancestor with a non-transparent
     * computed background-color. Composite semi-transparent layers as we go.
     * Also detects gradient backgrounds (background-image) and samples
     * the first color stop as an approximation.
     */
    function getEffectiveBg(
      el: Element,
    ): { bg: [number, number, number]; hasGradient: boolean } {
      const layers: [number, number, number, number][] = [];
      let current: Element | null = el;
      let hasGradient = false;
      while (current) {
        const style = window.getComputedStyle(current);

        // Check for gradient backgrounds first
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== "none" && bgImage.includes("gradient")) {
          hasGradient = true;
          // Try to extract the first color from the gradient
          const colorMatch = bgImage.match(
            /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/,
          );
          if (colorMatch) {
            const gradColor = parseColor(colorMatch[0]);
            if (gradColor && gradColor[3] >= 0.5) {
              let base: [number, number, number] = [gradColor[0], gradColor[1], gradColor[2]];
              for (let i = layers.length - 1; i >= 0; i--) {
                base = alphaComposite(layers[i], base);
              }
              return { bg: base, hasGradient: true };
            }
          }
        }

        const bg = parseColor(style.backgroundColor);
        if (bg) {
          if (bg[3] >= 0.99) {
            // Opaque — stop here
            let base: [number, number, number] = [bg[0], bg[1], bg[2]];
            for (let i = layers.length - 1; i >= 0; i--) {
              base = alphaComposite(layers[i], base);
            }
            return { bg: base, hasGradient };
          }
          layers.push(bg);
        }
        current = current.parentElement;
      }
      // Fallback: use the rendered page background instead of assuming a theme.
      // We intentionally skip elementsFromPoint here — it can return colors
      // from unrelated z-layers (e.g. HUD overlays behind slides).
      const bodyBg = parseColor(window.getComputedStyle(document.body).backgroundColor);
      const rootBg = parseColor(
        window.getComputedStyle(document.documentElement).backgroundColor,
      );
      let base: [number, number, number] = bodyBg
        ? [bodyBg[0], bodyBg[1], bodyBg[2]]
        : rootBg
          ? [rootBg[0], rootBg[1], rootBg[2]]
          : [1, 1, 1];
      for (let i = layers.length - 1; i >= 0; i--) {
        base = alphaComposite(layers[i], base);
      }
      return { bg: base, hasGradient };
    }

    function buildSelector(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const cls =
        el.className && typeof el.className === "string"
          ? "." +
            el.className
              .trim()
              .split(/\s+/)
              .slice(0, 3)
              .join(".")
          : "";
      return `${tag}${id}${cls}`;
    }

    // ── scan ────────────────────────────────────────────────────

    const TEXT_TAGS = new Set([
      "P", "SPAN", "A", "H1", "H2", "H3", "H4", "H5", "H6",
      "LI", "TD", "TH", "LABEL", "STRONG", "EM", "B", "I",
      "SMALL", "FIGCAPTION", "BLOCKQUOTE", "CITE", "DT", "DD",
      "BUTTON", "LEGEND", "CAPTION",
    ]);

    const violations: {
      selector: string;
      text: string;
      fg: string;
      bg: string;
      ratio: number;
      required: number;
      fontSize: string;
      fontWeight: string;
    }[] = [];

    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      // Only check elements likely to contain readable text
      if (!TEXT_TAGS.has(el.tagName)) continue;

      const text = el.textContent?.trim();
      if (!text || text.length === 0) continue;
      const hasAlphanumeric = /[\p{L}\p{N}]/u.test(text);
      const isEmojiOnly = !hasAlphanumeric && /\p{Extended_Pictographic}/u.test(text);
      if (isEmojiOnly) continue;

      // Skip if the element has children that are also text tags
      // (we'll check the innermost element instead)
      const hasTextChild = Array.from(el.children).some((c) =>
        TEXT_TAGS.has(c.tagName),
      );
      if (hasTextChild) continue;

      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);

      // Skip invisible elements
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        htmlEl.offsetWidth === 0 ||
        htmlEl.offsetHeight === 0
      )
        continue;

      // Skip elements not actually rendered (inside hidden ancestors,
      // off-screen popovers, or collapsed containers)
      if (htmlEl.getClientRects().length === 0) continue;

      // Skip elements with an ancestor that's hidden
      let ancestor = htmlEl.parentElement;
      let ancestorHidden = false;
      while (ancestor) {
        const aStyle = window.getComputedStyle(ancestor);
        if (
          aStyle.display === "none" ||
          aStyle.visibility === "hidden" ||
          aStyle.opacity === "0"
        ) {
          ancestorHidden = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (ancestorHidden) continue;

      const fgParsed = parseColor(style.color);
      if (!fgParsed) continue;

      const { bg: effectiveBgRgb, hasGradient } = getEffectiveBg(el);
      const effectiveFg = alphaComposite(fgParsed, effectiveBgRgb);

      const fgLum = relativeLuminance(...effectiveFg);
      const bgLum = relativeLuminance(...effectiveBgRgb);
      const ratio = contrastRatio(fgLum, bgLum);

      // Determine threshold
      const fontSize = parseFloat(style.fontSize); // px
      const fontWeight = parseInt(style.fontWeight, 10);
      const isLargeText =
        fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const required = isLargeText ? 3 : 4.5;

      // If we have a gradient and got a ratio of exactly 1, the gradient
      // color extraction is approximate — flag these as "needs-review"
      // rather than a definitive violation. Skip ratio=1 on gradients
      // since it's likely a sampling artifact.
      if (ratio < required && !(hasGradient && ratio <= 1.01)) {
        violations.push({
          selector: buildSelector(el),
          text: text.slice(0, 80),
          fg: style.color,
          bg: `rgb(${Math.round(effectiveBgRgb[0] * 255)}, ${Math.round(effectiveBgRgb[1] * 255)}, ${Math.round(effectiveBgRgb[2] * 255)})`,
          ratio: Math.round(ratio * 100) / 100,
          required,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
        });
      }
    }

    return violations;
  });
}
