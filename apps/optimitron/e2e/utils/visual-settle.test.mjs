import assert from "node:assert/strict";
import test from "node:test";
import {
  forceAnimationsComplete,
  prepareFullPageVisualCapture,
  waitForCaptureReady,
  waitForFonts,
  waitForImagesSettled,
} from "./visual-settle.mjs";

test("waits for a quiet pass after finishing newly-created animations", async () => {
  const settlementResults = [
    { finishedAnimations: 1, forcedElements: 0 },
    { finishedAnimations: 1, forcedElements: 0 },
    { finishedAnimations: 0, forcedElements: 0 },
  ];
  let settlementPasses = 0;
  let waits = 0;
  let stabilizationCss = "";

  const page = {
    async addStyleTag({ content }) {
      stabilizationCss = content;
    },
    async evaluate(action) {
      if (action.toString().includes("document.getAnimations")) {
        settlementPasses++;
        return settlementResults.shift();
      }
      return undefined;
    },
    async waitForTimeout() {
      waits++;
    },
    async waitForLoadState() {},
  };

  await forceAnimationsComplete(page);

  assert.equal(settlementPasses, 3);
  assert.equal(waits, 2);
  assert.match(stabilizationCss, /\[data-visual-force-complete\]/);
});

/**
 * A page double whose evaluated results are scripted per call. Each helper is
 * driven by its own queue so a test states exactly what the browser reports on
 * each poll.
 *
 * @param {unknown[]} results
 */
function pageReturning(results) {
  const remaining = [...results];
  const page = {
    calls: 0,
    waits: 0,
    async evaluate() {
      page.calls++;
      return remaining.length > 1 ? remaining.shift() : remaining[0];
    },
    async waitForTimeout() {
      page.waits++;
    },
    async waitForLoadState() {},
  };
  return page;
}

test("re-announces capture until every marker reports ready", async () => {
  // A listener that attaches late leaves the marker pending for two polls.
  // The old single dispatch could not recover from this; the poll must keep
  // announcing rather than announce once and wait.
  const states = [["president-task-list"], ["president-task-list"], []];
  const page = {
    dispatches: 0,
    waits: 0,
    async evaluate(action) {
      const sections = states.shift() ?? [];
      const previousDocument = globalThis.document;
      const previousWindow = globalThis.window;
      globalThis.document = {
        querySelectorAll() {
          return sections.map((visualSection) => ({
            dataset: { visualSection },
            id: "",
            tagName: "DIV",
          }));
        },
      };
      globalThis.window = {
        dispatchEvent() {
          page.dispatches++;
        },
      };
      try {
        return await action();
      } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
      }
    },
    async waitForTimeout() {
      page.waits++;
    },
    async waitForLoadState() {},
  };

  await waitForCaptureReady(page, 10_000);

  assert.equal(page.dispatches, 3);
  assert.equal(page.waits, 2);
});

test("settles capture readiness inside child frames", async () => {
  const mainFrame = {};
  const childFrame = pageReturning([["section[embed]"], []]);
  const page = pageReturning([[]]);
  page.frames = () => [mainFrame, childFrame];
  page.mainFrame = () => mainFrame;

  await waitForCaptureReady(page, 10_000);

  assert.equal(page.calls, 2);
  assert.equal(childFrame.calls, 2);
  assert.equal(page.waits, 1);
});

test("fails loudly when a capture marker never becomes ready", async () => {
  // Capturing a half-built page would write a wrong baseline, which is worse
  // than a failed run because every later comparison inherits it.
  const page = pageReturning([["section[timeline]"]]);

  await assert.rejects(
    () => waitForCaptureReady(page, 0),
    /visual capture readiness.*section\[timeline\]/s,
  );
});

test("waits for in-flight images and then decodes", async () => {
  const page = pageReturning([["/slow.png"], []]);

  await waitForImagesSettled(page, 10_000);

  // Two readiness polls plus the decode pass.
  assert.equal(page.calls, 3);
  assert.equal(page.waits, 1);
});

test("waits for images inside child frames", async () => {
  const mainFrame = {};
  const childFrame = pageReturning([["/embedded-slow.png"], [], undefined]);
  const page = pageReturning([[], [], undefined]);
  page.frames = () => [mainFrame, childFrame];
  page.mainFrame = () => mainFrame;

  await waitForImagesSettled(page, 10_000);

  assert.equal(page.calls, 3);
  assert.equal(childFrame.calls, 3);
  assert.equal(page.waits, 1);
});

test("fails loudly when a decode never settles", async () => {
  // `page.evaluate` has no timeout, so a decode that never settles used to
  // hang the whole capture until CI cancelled the job half an hour later with
  // no error and no indication of which route stalled.
  let decodeCalls = 0;
  const page = {
    calls: 0,
    waits: 0,
    async evaluate() {
      page.calls++;
      // The readiness poll reports no in-flight images, so the run reaches the
      // decode pass; that pass then never resolves.
      if (page.calls === 1) return [];
      decodeCalls++;
      return new Promise(() => {});
    },
    async waitForTimeout() {
      page.waits++;
    },
    async waitForLoadState() {},
  };

  await assert.rejects(
    () => waitForImagesSettled(page, 10),
    /images to decode/,
  );
  assert.equal(decodeCalls, 1);
});

test("fails loudly when an image never arrives", async () => {
  // Proceeding here would capture exactly the missing artwork this helper
  // exists to prevent, and would do it without any signal.
  const page = pageReturning([["/never.png"]]);

  await assert.rejects(
    () => waitForImagesSettled(page, 0),
    /images to load.*\/never\.png/s,
  );
});

test("waits for custom visual-capture state to commit", async () => {
  const mainFrame = {};
  let dispatches = 0;
  const page = {
    async evaluate(action) {
      const source = action.toString();
      if (source.includes("optimitron:visual-capture")) {
        dispatches++;
        return [];
      }
      if (source.includes("document.images")) return [];
      return undefined;
    },
    frames() {
      return [mainFrame];
    },
    mainFrame() {
      return mainFrame;
    },
    async waitForFunction() {},
    async waitForLoadState() {},
    async waitForTimeout() {},
  };

  await prepareFullPageVisualCapture(page);

  assert.ok(dispatches >= 1);
});

test("bounds font readiness waits", async () => {
  let receivedTimeout;
  const target = {
    async waitForFunction(_action, _argument, options) {
      receivedTimeout = options.timeout;
      throw new Error("font request stalled");
    },
  };

  assert.equal(await waitForFonts(target, 1234), false);
  assert.equal(receivedTimeout, 1234);
});
