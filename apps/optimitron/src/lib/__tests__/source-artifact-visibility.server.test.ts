import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { sourceArtifact: { findFirst: mocks.findFirst } },
}));

import {
  canUserViewSourceArtifact,
  getSourceArtifactManageWhere,
  getSourceArtifactVisibilityWhere,
} from "../source-artifact-visibility.server";

beforeEach(() => mocks.findFirst.mockReset());

describe("source artifact visibility", () => {
  it("limits anonymous reads to public sources", () => {
    expect(getSourceArtifactVisibilityWhere()).toEqual({ isPublic: true });
  });

  it("allows signed-in users to read owned and member-organization sources", () => {
    expect(getSourceArtifactVisibilityWhere("user_1").OR).toEqual(
      expect.arrayContaining([
        { ownerUserId: "user_1" },
        {
          ownerOrganization: {
            members: { some: { userId: "user_1" } },
          },
        },
      ]),
    );
  });

  it("keeps organization source deletion owner/admin-only", () => {
    const where = getSourceArtifactManageWhere("user_1");
    const organizationBranch = where.OR?.find(
      (branch) => "ownerOrganization" in branch,
    );
    expect(organizationBranch).toMatchObject({
      ownerOrganization: {
        members: {
          some: { role: { in: ["OWNER", "ADMIN"] }, userId: "user_1" },
        },
      },
    });
  });

  it("returns false without leaking a private source's existence", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(
      canUserViewSourceArtifact("private_source", "outsider_1"),
    ).resolves.toBe(false);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "private_source" }),
      select: { id: true },
    });
  });
});
