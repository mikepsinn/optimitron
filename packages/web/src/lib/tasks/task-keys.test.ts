import { describe, expect, it } from "vitest";
import {
  TREATY_PARENT_TASK_ID,
  TREATY_PARENT_TASK_KEY,
  getTreatyParentTaskHref,
  getTreatySignerTaskId,
  getTreatySignerTaskKey,
  isTreatyParentTaskKey,
  isTreatySignerTaskKey,
} from "./task-keys";

describe("task keys", () => {
  it("builds stable treaty ids, keys, and hrefs from shared constants", () => {
    expect(TREATY_PARENT_TASK_KEY).toBe("program:one-percent-treaty:ratify");
    expect(TREATY_PARENT_TASK_ID).toBe("1-pct-treaty");
    expect(getTreatyParentTaskHref()).toBe("/tasks/1-pct-treaty");
    expect(getTreatySignerTaskKey({ countryCode: "AU" })).toBe(
      "program:one-percent-treaty:signer:au",
    );
    expect(getTreatySignerTaskId({ countryCode: "AU" })).toBe("1-pct-treaty-signer-au");
  });

  it("distinguishes signer tasks from child-style treaty keys", () => {
    expect(isTreatyParentTaskKey("program:one-percent-treaty:ratify")).toBe(true);
    expect(isTreatySignerTaskKey("program:one-percent-treaty:signer:au")).toBe(true);
    expect(isTreatySignerTaskKey("program:one-percent-treaty:signer:au:support:contact-office")).toBe(false);
  });
});
