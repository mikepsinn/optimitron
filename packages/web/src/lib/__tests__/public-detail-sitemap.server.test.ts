import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus } from "@optimitron/db";
import { getSiteConfig } from "@/lib/site";

const mocks = vi.hoisted(() => ({
  organizationFindMany: vi.fn(),
  personFindMany: vi.fn(),
  taskFindMany: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findMany: mocks.organizationFindMany },
    person: { findMany: mocks.personFindMany },
    task: { findMany: mocks.taskFindMany },
  },
}));

import { getPublicDetailSitemapEntries } from "@/lib/public-detail-sitemap.server";

describe("getPublicDetailSitemapEntries", () => {
  beforeEach(() => {
    mocks.organizationFindMany.mockReset();
    mocks.personFindMany.mockReset();
    mocks.taskFindMany.mockReset();
    mocks.organizationFindMany.mockResolvedValue([]);
    mocks.personFindMany.mockResolvedValue([]);
    mocks.taskFindMany.mockResolvedValue([]);
  });

  it("adds approved organization survey pages to the campaign sitemap", async () => {
    mocks.organizationFindMany.mockResolvedValue([
      {
        slug: "open-philanthropy",
        updatedAt: new Date("2026-05-01T00:00:00Z"),
      },
    ]);

    const entries = await getPublicDetailSitemapEntries(
      getSiteConfig("warOnDisease"),
    );

    expect(mocks.organizationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, status: OrgStatus.APPROVED },
        select: { slug: true, updatedAt: true },
        take: 500,
      }),
    );
    expect(entries.map((entry) => entry.url)).toContain(
      "https://warondisease.org/survey/open-philanthropy",
    );
  });

  it("does not add organization survey pages on sites that do not publish survey routes", async () => {
    mocks.organizationFindMany.mockResolvedValue([
      {
        slug: "open-philanthropy",
        updatedAt: new Date("2026-05-01T00:00:00Z"),
      },
    ]);

    const entries = await getPublicDetailSitemapEntries(getSiteConfig("dfda"));

    expect(entries.map((entry) => entry.url)).not.toContain(
      "https://dfda.earth/survey/open-philanthropy",
    );
  });
});
