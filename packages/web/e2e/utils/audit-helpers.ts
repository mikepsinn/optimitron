/**
 * Shared helpers for the contrast and mobile-responsiveness audit specs.
 */
import type { Page, Response } from "@playwright/test";
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
  await retryAfterNavigation(page, async () => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        .opacity-0 { opacity: 1 !important; }
        [data-visual-force-visible] {
          opacity: 1 !important;
          transform: none !important;
        }
      `,
    });
  });

  // Framer Motion sets opacity via inline styles while animating, which CSS
  // overrides can't reliably normalize. Force any inline opacity below 1 up to
  // 1 so audits measure the settled UI state rather than a transient frame.
  // Elements can hydrate and start a fade after a scan completes, so rescan
  // until a pass finds nothing new (bounded — a scan that races hydration was
  // the main source of blank sections in visual-review diffs).
  await retryAfterNavigation(page, async () => {
    for (let pass = 0; pass < 5; pass++) {
      const forced = await page.evaluate(() => {
        let count = 0;
        const all = document.querySelectorAll("*");
        for (const el of all) {
          const htmlEl = el as HTMLElement;
          const inlineOpacity = Number.parseFloat(htmlEl.style.opacity);
          if (Number.isFinite(inlineOpacity) && inlineOpacity < 1) {
            htmlEl.dataset.visualForceVisible = "";
            htmlEl.style.opacity = "1";
            htmlEl.style.transform = "none";
            count++;
          }
        }
        return count;
      });
      if (forced === 0 && pass > 0) break;
      if (pass < 4) {
        await page.waitForTimeout(100);
      }
    }
  });

  await waitForPaint(page);
}

/**
 * Navigate to a page. For demo slides (containing #), handles the
 * hash-based navigation with proper waits.
 */
export async function navigateAndSettle(
  page: Page,
  url: string,
): Promise<Response | null> {
  const isDemoSlide = url.includes("#");
  // Demo page loads 60+ lazy slide components — needs more time.
  // Dev server on first compile can also be slow.
  const timeout = isDemoSlide ? 60_000 : 30_000;
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });

  if (isDemoSlide) {
    const slideId = url.split("#")[1]!;
    await waitForDemoSlide(page, slideId);
    await freezeDemoPlayback(page);
  } else {
    await waitForPaint(page);
  }

  // Force all animated content to be visible
  await forceAnimationsComplete(page);

  return response;
}

async function freezeDemoPlayback(page: Page): Promise<void> {
  await retryAfterNavigation(page, async () => {
    await page.evaluate(() => {
      const nav = (window as Window & {
        __demoNav?: { getSlide: () => number; setSlide: (index: number) => void };
      }).__demoNav;

      if (!nav) return;
      nav.setSlide(nav.getSlide());
    });
  });

  await page.waitForTimeout(150);
}

export async function waitForPaint(page: Page): Promise<void> {
  await retryAfterNavigation(page, async () => {
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    }));
  });
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

async function retryAfterNavigation(
  page: Page,
  action: () => Promise<void>,
  maxRetries = 2,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      if (!isExecutionContextResetError(error) || attempt === maxRetries) {
        throw error;
      }

      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(250);
    }
  }
}

function isExecutionContextResetError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("Execution context was destroyed")
    || error.message.includes("Cannot find context with specified id")
    || error.message.includes("Most likely the page has been closed")
    || error.message.includes("Target page, context or browser has been closed");
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

      // Skip elements inside an overflow:hidden container or an intentional
      // horizontally scrollable container. Those patterns are already
      // contained and are not true viewport breakage.
      let isClippedByParent = false;
      let isContainedByScrollParent = false;
      let isChildOfOverflow = false;
      let parent = el.parentElement;
      while (parent) {
        const pStyle = window.getComputedStyle(parent);
        if (pStyle.overflow === "hidden" || pStyle.overflowX === "hidden") {
          isClippedByParent = true;
          break;
        }
        const allowsHorizontalScroll =
          pStyle.overflow === "auto" ||
          pStyle.overflow === "scroll" ||
          pStyle.overflowX === "auto" ||
          pStyle.overflowX === "scroll";
        if (
          allowsHorizontalScroll &&
          parent.scrollWidth > parent.clientWidth + 5 &&
          parent.clientWidth <= vw + 5
        ) {
          isContainedByScrollParent = true;
          break;
        }
        const pRect = parent.getBoundingClientRect();
        if (pRect.right > vw + 5 && pRect.width > 0) {
          isChildOfOverflow = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (isClippedByParent || isContainedByScrollParent || isChildOfOverflow) continue;

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
