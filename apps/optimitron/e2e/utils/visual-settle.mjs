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
        [data-visual-force-complete] {
          transform: none !important;
        }
      `,
    });
  });

  // Framer Motion can create another animation after a prior animation's
  // finish callback updates React state. Rescan until a complete pass finds
  // neither a new animation nor a newly hidden element.
  await retryAfterNavigation(page, async () => {
    for (let pass = 0; pass < 5; pass++) {
      const settled = await page.evaluate(() => {
        let finishedAnimations = 0;
        let forcedElements = 0;
        for (const animation of document.getAnimations()) {
          try {
            if (
              animation.effect?.getTiming().iterations !== Infinity &&
              animation.playState !== "finished"
            ) {
              animation.finish();
              finishedAnimations++;
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
            forcedElements++;
          }
        }
        return { finishedAnimations, forcedElements };
      });
      if (
        settled.finishedAnimations === 0 &&
        settled.forcedElements === 0 &&
        pass > 0
      ) {
        break;
      }
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
      let nextY = 0;
      let visitedViewports = 0;
      for (let pass = 0; pass < 3 && visitedViewports < 120; pass++) {
        const passHeight = document.documentElement.scrollHeight;
        while (nextY < passHeight && visitedViewports < 120) {
          window.scrollTo(0, nextY);
          await new Promise((resolve) => setTimeout(resolve, 40));
          nextY += viewportStep;
          visitedViewports++;
        }
        window.scrollTo(0, passHeight);
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (document.documentElement.scrollHeight <= passHeight) break;
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
        await waitForFonts(frame);
        await frame.evaluate(() =>
          window.dispatchEvent(new Event("optimitron:visual-capture")),
        );
      }),
  );

  await retryAfterNavigation(page, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
  });
  await waitForPaint(page);

  await waitForCaptureReady(page);
  await waitForImagesSettled(page);
  await waitForPaint(page);
}

/**
 * Announce the capture to components that render a deterministic completed
 * state, and wait for each to report it is ready.
 *
 * The event is re-dispatched on every poll rather than fired once. A component
 * that has rendered its `[data-visual-capture-ready="false"]` marker but has
 * not yet attached its listener — React paints before it runs effects — would
 * otherwise miss a single dispatch entirely and never flip to ready, and the
 * only symptom is this wait timing out ten seconds later on a page that looks
 * fine. Re-dispatching costs nothing and makes that race harmless.
 *
 * Throws on timeout. The wait this replaces was a `locator.waitFor` that threw,
 * and a capture is worth less than nothing if it silently records a half-built
 * page as a baseline: a phantom diff wastes a review, but a bad baseline
 * quietly redefines "correct" for every run after it.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForCaptureReady(page, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const pending = (
      await Promise.all(
        evaluationTargets(page).map((target) =>
          retryingEvaluate(target, () => {
            window.dispatchEvent(new Event("optimitron:visual-capture"));
            return Array.from(
              document.querySelectorAll(
                '[data-visual-capture-ready="false"]',
              ),
            ).map(
              (element) =>
                `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}` +
                `${element.dataset.visualSection ? `[${element.dataset.visualSection}]` : ""}`,
            );
          }),
        ),
      )
    ).flatMap((result) => result ?? []);
    if (pending.length === 0) return;
    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out after ${timeout}ms waiting for visual capture readiness. ` +
          `Still not ready: ${pending.join(", ")}`,
      );
    }
    await page.waitForTimeout(100);
  }
}

/**
 * Wait for every image to finish loading and decoding.
 *
 * Promoting `loading="lazy"` to eager and scrolling the page starts the
 * requests but nothing waits for them, so a capture can be taken while an
 * image is still in flight. The failure is silent and asymmetric: the text
 * around the image is pixel-identical, the page height is unchanged, and only
 * the artwork is missing, which reads as a real visual regression.
 *
 * `complete` is the right predicate because it also becomes true for an image
 * that errored — a genuinely broken `src` must not hold capture open. `decode`
 * then guarantees the bitmap is ready to paint rather than merely downloaded.
 *
 * Throws on timeout for the same reason as `waitForCaptureReady`: proceeding
 * would capture exactly the missing artwork this helper exists to prevent, and
 * would do it silently.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForImagesSettled(page, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const pending = (
      await Promise.all(
        evaluationTargets(page).map((target) =>
          retryingEvaluate(target, () =>
            Array.from(document.images)
              .filter((image) => !image.complete)
              .map((image) => image.currentSrc || image.src || "(no src)"),
          ),
        ),
      )
    ).flatMap((result) => result ?? []);
    if (pending.length === 0) break;
    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out after ${timeout}ms waiting for images to load. ` +
          `Still in flight: ${pending.join(", ")}`,
      );
    }
    await page.waitForTimeout(100);
  }

  await withDeadline(
    Promise.all(
      evaluationTargets(page).map((target) =>
        retryingEvaluate(target, async () => {
          await Promise.allSettled(
            Array.from(document.images)
              .filter((image) => image.complete && image.naturalWidth > 0)
              .map((image) => image.decode()),
          );
        }),
      ),
    ),
    Math.max(1_000, deadline - Date.now()),
    `Timed out after ${timeout}ms waiting for images to decode.`,
  );
}

/** Raised by `withDeadline`, so callers can tell a stall from a real failure. */
class DeadlineExceededError extends Error {}

/**
 * Reject if `work` has not settled within `timeout`.
 *
 * `page.evaluate` has no timeout of its own, so an evaluation whose promise
 * never resolves — a wedged renderer, an image `decode()` that never settles —
 * hangs the caller forever rather than failing. A capture that stops
 * responding then consumes the entire CI job budget and reports nothing but
 * "The operation was canceled", with no indication of which route stalled.
 *
 * Losing the race does not cancel the underlying evaluation; it stays pending
 * until its context closes.
 *
 * @template T
 * @param {Promise<T>} work
 * @param {number} timeout
 * @param {string} message
 * @returns {Promise<T>}
 */
async function withDeadline(work, timeout, message) {
  let timer;
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new DeadlineExceededError(message)),
          timeout,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Return the page for its main document plus every currently attached child
 * frame. Rebuilding this list on each poll also catches frames mounted during
 * capture settlement.
 *
 * @param {import("@playwright/test").Page} page
 * @returns {(import("@playwright/test").Page | import("@playwright/test").Frame)[]}
 */
function evaluationTargets(page) {
  if (typeof page.frames !== "function" || typeof page.mainFrame !== "function") {
    return [page];
  }
  const mainFrame = page.mainFrame();
  return [page, ...page.frames().filter((frame) => frame !== mainFrame)];
}

/**
 * `page.evaluate` that survives a navigation racing the evaluation.
 *
 * @template T
 * @param {import("@playwright/test").Page | import("@playwright/test").Frame} target
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<T | undefined>}
 */
async function retryingEvaluate(target, fn) {
  let result;
  await retryAfterNavigation(target, async () => {
    result = await target.evaluate(fn);
  });
  return result;
}

/**
 * Wait for web fonts without allowing a stalled font request to hang capture.
 *
 * @param {import("@playwright/test").Page | import("@playwright/test").Frame} target
 * @param {number} [timeout]
 */
export async function waitForFonts(target, timeout = 10_000) {
  try {
    await target.waitForFunction(
      () => !document.fonts || document.fonts.status === "loaded",
      undefined,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Settle on a painted frame, but do not require one.
 *
 * `requestAnimationFrame` only runs while the renderer is producing frames, so
 * a page the browser has stopped rendering never invokes the callback. Unlike
 * the readiness waits above, this is polish: `page.screenshot` forces its own
 * frame, so proceeding without the extra paint costs nothing.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [timeout]
 */
export async function waitForPaint(page, timeout = 5_000) {
  await withDeadline(
    retryAfterNavigation(page, async () => {
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }),
      );
    }),
    timeout,
    `Timed out after ${timeout}ms waiting for a painted frame.`,
  ).catch((error) => {
    if (!(error instanceof DeadlineExceededError)) {
      throw error;
    }
  });
}

/**
 * @param {import("@playwright/test").Page | import("@playwright/test").Frame} target
 * @param {() => Promise<void>} action
 * @param {number} [maxRetries]
 */
export async function retryAfterNavigation(target, action, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      if (!isExecutionContextResetError(error) || attempt === maxRetries) {
        throw error;
      }

      await target.waitForLoadState("domcontentloaded").catch(() => {});
      await target.waitForTimeout(250);
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
