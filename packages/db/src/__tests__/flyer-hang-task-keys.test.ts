import { describe, expect, it } from "vitest";
import {
  buildFlyerHangPlaceTaskKey,
  getUserHangFlyersTaskKey,
  isFlyerHangPlaceTaskKey,
} from "../task-keys.js";

describe("flyer hang task keys", () => {
  it("builds stable place keys including negative longitudes", () => {
    expect(
      buildFlyerHangPlaceTaskKey({
        placeId: "30.27:-97.74:library",
        source: "grid",
      }),
    ).toBe("flyer-hang:place:grid:30.27:-97.74:library");
  });

  it("builds personal hangFlyers subtask keys", () => {
    expect(getUserHangFlyersTaskKey("abc")).toBe(
      "program:one-percent-treaty:user:abc:hangFlyers",
    );
    expect(isFlyerHangPlaceTaskKey(getUserHangFlyersTaskKey("abc"))).toBe(
      false,
    );
  });
});
