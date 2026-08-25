import assert from "node:assert/strict";
import test from "node:test";
import {
  forceAnimationsComplete,
  prepareFullPageVisualCapture,
  waitForFonts,
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

test("waits for custom visual-capture state to commit", async () => {
  const waitFunctions = [];
  const mainFrame = {};
  const page = {
    async evaluate() {},
    frames() {
      return [mainFrame];
    },
    mainFrame() {
      return mainFrame;
    },
    async waitForFunction(action) {
      waitFunctions.push(action.toString());
    },
    async waitForLoadState() {},
  };

  await prepareFullPageVisualCapture(page);

  assert.ok(
    waitFunctions.some((source) =>
      source.includes('data-visual-capture-ready="false"'),
    ),
  );
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
