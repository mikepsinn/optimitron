import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  organizationFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: mocks.organizationFindUnique,
    },
  },
}));

import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";

describe("organization survey lookup", () => {
  beforeEach(() => {
    mocks.organizationFindUnique.mockReset();
  });

  it("returns approved organizations for neutral survey routes", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      name: "Trial Partner",
      slug: "trial-partner",
      status: OrgStatus.APPROVED,
      deletedAt: null,
    });

    await expect(getApprovedOrganizationForSurveySlug("trial-partner")).resolves.toEqual(
      expect.objectContaining({ id: "org_1" }),
    );
  });

  it("does not expose pending organizations on survey routes", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_2",
      name: "Pending Partner",
      slug: "pending-partner",
      status: OrgStatus.PENDING,
      deletedAt: null,
    });

    await expect(getApprovedOrganizationForSurveySlug("pending-partner")).resolves.toBeNull();
  });

  it("does not require a signing secret for public organization survey routes", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      name: "Trial Partner",
      slug: "trial-partner",
      status: OrgStatus.APPROVED,
      deletedAt: null,
    });

    await expect(getApprovedOrganizationForSurveySlug("trial-partner")).resolves.toEqual(
      expect.objectContaining({ id: "org_1", slug: "trial-partner" }),
    );
  });
});
