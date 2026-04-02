/**
 * Shared helpers for the contrast and mobile-responsiveness audit specs.
 */
import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Wait for a demo slide to actually render after hash navigation.
 * The DemoPlayer is a client component that must hydrate, read the hash,
 * find the matching segment, and lazy-load the slide via React.lazy().
 */
export async function waitForDemoSlide(
  page: Page,
  slideId: string,
  timeout = 10_000,
): Promise<void> {
  // Wait for the slide-specific data-testid OR the generic sierra-slide marker
  try {
    await page.waitForSelector(
      `[data-testid="slide-${slideId}"]`,
      { state: "visible", timeout },
    );
  } catch {
    // Fallback: wait for any sierra slide content to be present
    await page.waitForSelector(
      '[data-testid="sierra-slide"]',
      { state: "visible", timeout: 3_000 },
    ).catch(() => {
      // Last resort — just wait a bit longer
    });
  }
  // Demo slides use React state-driven phased animations (useState + useEffect
  // with timeouts). CSS overrides can't force these — we need to wait for all
  // phases to complete. Most slides finish within 5-8 seconds.
  await page.waitForTimeout(8_000);
}

/**
 * Inject CSS that disables all transitions/animations and forces all
 * opacity-0 elements to full opacity. Also handles Framer Motion
 * which uses JavaScript-driven inline styles that CSS can't override.
 */
export async function forceAnimationsComplete(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      .opacity-0 { opacity: 1 !important; }
    `,
  });

  // Framer Motion sets opacity via inline style (JS-driven), which CSS
  // !important on attribute selectors can't reliably override.
  // Force all inline opacity:0 to 1 via JavaScript.
  await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.opacity === "0" || htmlEl.style.opacity === "0.0") {
        htmlEl.style.opacity = "1";
      }
    }
  });

  // Give the browser a tick to repaint
  await page.waitForTimeout(200);
}

/**
 * Navigate to a page. For demo slides (containing #), handles the
 * hash-based navigation with proper waits.
 */
export async function navigateAndSettle(
  page: Page,
  url: string,
): Promise<void> {
  const isDemoSlide = url.includes("#");
  // Demo page loads 60+ lazy slide components — needs more time
  const timeout = isDemoSlide ? 60_000 : 15_000;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout });

  if (isDemoSlide) {
    const slideId = url.split("#")[1]!;
    await waitForDemoSlide(page, slideId);
  } else {
    // Regular page — wait for hydration
    await page.waitForTimeout(2000);
  }

  // Force all animated content to be visible
  await forceAnimationsComplete(page);
}

/**
 * Write a JSON audit report to the playwright-report directory.
 */
export function writeAuditReport(
  name: string,
  data: unknown,
): string {
  const dir = path.resolve(__dirname, "..", "..", "playwright-report");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

/**
 * De-duplicate overflowing elements by ancestry.
 * If a parent overflows, all its children also overflow —
 * we only want the outermost (root cause) element.
 */
export async function getDeduplicatedOverflows(
  page: Page,
  viewportWidth: number,
): Promise<{ selector: string; right: number; width: number; text: string }[]> {
  return page.evaluate((vw: number) => {
    const overflowing: {
      el: Element;
      selector: string;
      right: number;
      width: number;
      text: string;
    }[] = [];

    const els = document.querySelectorAll("*");
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right <= vw + 5) continue; // +5px tolerance

      // Check if any ancestor is already in the overflow list
      let isChildOfOverflow = false;
      let parent = el.parentElement;
      while (parent) {
        const pRect = parent.getBoundingClientRect();
        if (pRect.right > vw + 5 && pRect.width > 0) {
          isChildOfOverflow = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isChildOfOverflow) continue;

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
      const text = el.textContent?.trim().slice(0, 40) || "";

      overflowing.push({
        el,
        selector: `${tag}${id}${cls}`,
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        text,
      });
    }

    // Return without the DOM element reference
    return overflowing.map(({ selector, right, width, text }) => ({
      selector,
      right,
      width,
      text,
    }));
  }, viewportWidth);
}
