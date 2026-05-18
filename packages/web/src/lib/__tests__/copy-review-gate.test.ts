import { describe, expect, it } from "vitest";
import {
  buildCopyReviewGateResult,
  formatCopyReviewGateMessage,
  isPublicCopyPath,
} from "../copy-review-gate";

describe("copy review gate", () => {
  it.each([
    "packages/web/src/app/profile/page.tsx",
    "packages/web/src/components/profile/PublicProfileOwnerControls.tsx",
    "packages/web/src/content/referendum-sites/one-percent-treaty.ts",
    "packages/web/src/messages/en-US/war-on-disease.json",
    "packages/web/src/lib/messaging.ts",
    "packages/web/src/lib/routes.ts",
    "packages/web/src/lib/email/post-vote-share.email.md",
    "packages/web/src/lib/tasks/share-templates.ts",
  ])("treats %s as public copy", (filePath) => {
    expect(isPublicCopyPath(filePath)).toBe(true);
  });

  it.each([
    "packages/web/src/lib/__tests__/messaging.test.ts",
    "packages/web/src/components/tasks/PublicProfileTaskSection.test.tsx",
    "packages/web/src/lib/tasks.server.ts",
    "packages/web/scripts/build-visual-review.mjs",
    "packages/db/prisma/schema.prisma",
  ])("does not treat %s as public copy by default", (filePath) => {
    expect(isPublicCopyPath(filePath)).toBe(false);
  });

  it("blocks public copy changes until explicitly approved", () => {
    const result = buildCopyReviewGateResult({
      changedPaths: ["packages/web/src/app/profile/page.tsx"],
      env: {},
    });

    expect(result.shouldBlock).toBe(true);
    expect(result.publicCopyPaths).toEqual(["packages/web/src/app/profile/page.tsx"]);
  });

  it("allows an explicit human-approved override", () => {
    const result = buildCopyReviewGateResult({
      changedPaths: ["packages/web/src/app/profile/page.tsx"],
      env: { COPY_REVIEW_APPROVED: "1" },
    });

    expect(result.shouldBlock).toBe(false);
    expect(result.publicCopyPaths).toEqual(["packages/web/src/app/profile/page.tsx"]);
  });

  it("prints the minimum strategic brief needed before approval", () => {
    const message = formatCopyReviewGateMessage([
      "packages/web/src/app/profile/page.tsx",
    ]);

    expect(message).toContain("Audience:");
    expect(message).toContain("Desired action:");
    expect(message).toContain("Old copy's strategic job:");
    expect(message).toContain("Manual/source phrase checked:");
    expect(message).toContain("COPY_REVIEW_APPROVED=1");
  });
});
