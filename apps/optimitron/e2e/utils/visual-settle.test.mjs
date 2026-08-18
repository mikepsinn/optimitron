import assert from "node:assert/strict";
import test from "node:test";
import { forceAnimationsComplete } from "./visual-settle.mjs";

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
