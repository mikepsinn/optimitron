import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const guardedLiteRoutes = ["src/app/demo/page.tsx"];

describe("treaty post-vote flow mounts", () => {
  it("keeps the demo route off the full post-vote referral flow", () => {
    const offenders = guardedLiteRoutes.filter((routePath) => {
      const absolutePath = join(process.cwd(), routePath);
      if (!existsSync(absolutePath)) return false;

      const source = readFileSync(absolutePath, "utf8");
      return source.includes("TreatyPostVoteShareFlow") || source.includes("TreatyVoteFlow");
    });

    expect(offenders).toEqual([]);
  });
});
