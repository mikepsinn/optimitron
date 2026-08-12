/**
 * Finish CSS and Framer Motion animation states before visual capture.
 * Shared by the main web Playwright suite and the standalone site-app smoke.
 *
 * @param {import("@playwright/test").Page} page
 */
export async function forceAnimationsComplete(page) {
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

  // Framer Motion can update inline opacity after hydration. Rescan until a
  // complete pass finds no new hidden elements, then wait for two paints.
  await retryAfterNavigation(page, async () => {
    for (let pass = 0; pass < 5; pass++) {
      const forced = await page.evaluate(() => {
        let count = 0;
        for (const animation of document.getAnimations()) {
          try {
            if (animation.effect?.getTiming().iterations !== Infinity) {
              animation.finish();
            }
          } catch {
            // Some browser-managed animations cannot be finished explicitly.
          }
        }
        const all = document.querySelectorAll("*");
        for (const element of all) {
          const inlineOpacity = Number.parseFloat(element.style.opacity);
          if (Number.isFinite(inlineOpacity) && inlineOpacity < 1) {
            element.dataset.visualForceVisible = "";
            element.style.opacity = "1";
            element.style.transform = "none";
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
 * Prepare a full page by visiting every viewport. This triggers Intersection
 * Observer and Framer Motion whileInView states before capture. Native lazy
 * content is promoted to eager loading, and custom scroll-driven components
 * receive an explicit request to render their deterministic completed state.
 *
 * @param {import("@playwright/test").Page} page
 */
export async function prepareFullPageVisualCapture(page) {
  await retryAfterNavigation(page, async () => {
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      for (const element of document.querySelectorAll(
        'img[loading="lazy"], iframe[loading="lazy"]',
      )) {
        element.setAttribute("loading", "eager");
      }

      const viewportStep = Math.max(400, Math.floor(window.innerHeight * 0.8));
      for (
        let y = 0;
        y < document.documentElement.scrollHeight;
        y += viewportStep
      ) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  await page
    .waitForFunction(
      () =>
        Array.from(document.querySelectorAll("iframe[src]")).every((iframe) => {
          try {
            const expectedUrl = new URL(iframe.src, document.baseURI).href;
            const actualUrl = iframe.contentWindow?.location.href;
            return (
              actualUrl !== "about:blank" &&
              actualUrl === expectedUrl &&
              iframe.contentDocument?.readyState === "complete"
            );
          } catch {
            // Cross-origin frames cannot expose readiness to the parent.
            // Their own load lifecycle is handled by Playwright below.
            return true;
          }
        }),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => undefined);

  await Promise.allSettled(
    page
      .frames()
      .filter((frame) => frame !== page.mainFrame())
      .map(async (frame) => {
        await frame.waitForLoadState("load", { timeout: 10_000 });
        await frame.evaluate(() => document.fonts.ready);
        await frame.evaluate(() =>
          window.dispatchEvent(new Event("optimitron:visual-capture")),
        );
      }),
  );

  await retryAfterNavigation(page, async () => {
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      window.dispatchEvent(new Event("optimitron:visual-capture"));
    });
  });
  await waitForPaint(page);
}

/** @param {import("@playwright/test").Page} page */
export async function waitForPaint(page) {
  await retryAfterNavigation(page, async () => {
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        }),
    );
  });
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {() => Promise<void>} action
 * @param {number} [maxRetries]
 */
export async function retryAfterNavigation(page, action, maxRetries = 2) {
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

/** @param {unknown} error */
function isExecutionContextResetError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Execution context was destroyed") ||
    error.message.includes("Cannot find context with specified id") ||
    error.message.includes("Most likely the page has been closed") ||
    error.message.includes("Target page, context or browser has been closed")
  );
}
