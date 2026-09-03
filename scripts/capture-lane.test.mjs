import assert from "node:assert/strict";
import test from "node:test";

import { runCaptureLane } from "./capture-lane.mjs";

class Wedged extends Error {}

/** A lane factory that records every lane it opened and closed. */
function laneFactory() {
  const opened = [];
  return {
    opened,
    async openLane() {
      const lane = {
        closed: false,
        id: opened.length,
        async close() {
          lane.closed = true;
        },
      };
      opened.push(lane);
      return lane;
    },
  };
}

const isRecoverable = (error) => error instanceof Wedged;

test("captures every route on one lane when nothing wedges", async () => {
  const { opened, openLane } = laneFactory();
  const captured = [];

  await runCaptureLane({
    routes: ["a", "b", "c"],
    openLane,
    captureRoute: async (route) => captured.push(route),
    isRecoverable,
    maxRecycles: 3,
  });

  assert.deepEqual(captured, ["a", "b", "c"]);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].closed, true);
});

test("retries the wedged route on a fresh lane", async () => {
  // The route that wedged must be captured, not skipped: a lane that dropped
  // it would leave a stale screenshot in the review with nothing to say so.
  const { opened, openLane } = laneFactory();
  const attempts = [];
  let wedge = true;

  await runCaptureLane({
    routes: ["a", "b", "c"],
    openLane,
    captureRoute: async (route, lane) => {
      attempts.push(`${route}@${lane.id}`);
      if (route === "b" && wedge) {
        wedge = false;
        throw new Wedged("b wedged");
      }
    },
    isRecoverable,
    maxRecycles: 3,
  });

  assert.deepEqual(attempts, ["a@0", "b@0", "b@1", "c@1"]);
  assert.equal(opened.length, 2);
  assert.deepEqual(
    opened.map((lane) => lane.closed),
    [true, true],
  );
});

test("reports each recycle once", async () => {
  const { openLane } = laneFactory();
  const recycles = [];
  let remaining = 2;

  await runCaptureLane({
    routes: ["a"],
    openLane,
    captureRoute: async () => {
      if (remaining > 0) {
        remaining -= 1;
        throw new Wedged("still wedged");
      }
    },
    isRecoverable,
    maxRecycles: 3,
    onRecycle: (route, count) => recycles.push(`${route}:${count}`),
  });

  assert.deepEqual(recycles, ["a:1", "a:2"]);
});

test("gives up once the recycle cap is spent", async () => {
  // A route that wedges every lane has to end the run; rebuilding forever
  // would burn the whole job and report nothing.
  const { opened, openLane } = laneFactory();
  let attempts = 0;

  await assert.rejects(
    () =>
      runCaptureLane({
        routes: ["a"],
        openLane,
        captureRoute: async () => {
          attempts += 1;
          throw new Wedged("always wedged");
        },
        isRecoverable,
        maxRecycles: 3,
      }),
    /always wedged/,
  );

  // The first attempt plus one per recycle.
  assert.equal(attempts, 4);
  assert.equal(opened.length, 4);
  assert.equal(
    opened.every((lane) => lane.closed),
    true,
  );
});

test("lets an ordinary capture failure through on the first attempt", async () => {
  // Retrying a real failure three times would bury it and waste six minutes
  // of budget before reporting the same thing.
  const { opened, openLane } = laneFactory();
  let attempts = 0;

  await assert.rejects(
    () =>
      runCaptureLane({
        routes: ["a"],
        openLane,
        captureRoute: async () => {
          attempts += 1;
          throw new Error("returned HTTP 500");
        },
        isRecoverable,
        maxRecycles: 3,
      }),
    /returned HTTP 500/,
  );

  assert.equal(attempts, 1);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].closed, true);
});

test("closes the lane when a route fails", async () => {
  const { opened, openLane } = laneFactory();

  await assert.rejects(
    () =>
      runCaptureLane({
        routes: ["a"],
        openLane,
        captureRoute: async () => {
          throw new Error("boom");
        },
        isRecoverable,
        maxRecycles: 0,
      }),
    /boom/,
  );

  assert.equal(opened[0].closed, true);
});
