import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  organizationFindUnique: vi.fn(),
  issueOrgContextToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: mocks.organizationFindUnique,
    },
  },
}));

vi.mock("@/lib/organization-context-token.server", () => ({
  issueOrgContextToken: mocks.issueOrgContextToken,
}));

import {
  getApprovedOrganizationForSurveySlug,
  getApprovedOrganizationSurveyContext,
} from "@/lib/organization.server";

describe("organization survey lookup", () => {
  beforeEach(() => {
    mocks.organizationFindUnique.mockReset();
    mocks.issueOrgContextToken.mockReset();
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

  it("returns approved organization survey context with a signed token", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      name: "Trial Partner",
      slug: "trial-partner",
      status: OrgStatus.APPROVED,
      deletedAt: null,
    });
    mocks.issueOrgContextToken.mockReturnValue({ encoded: "signed-token" });

    await expect(getApprovedOrganizationSurveyContext("trial-partner")).resolves.toEqual(
      expect.objectContaining({
        organization: expect.objectContaining({ id: "org_1" }),
        orgContextToken: "signed-token",
      }),
    );
  });

  it("fails closed when organization survey token signing is unavailable", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      name: "Trial Partner",
      slug: "trial-partner",
      status: OrgStatus.APPROVED,
      deletedAt: null,
    });
    mocks.issueOrgContextToken.mockImplementation(() => {
      throw new Error("missing secret");
    });

    await expect(
      getApprovedOrganizationSurveyContext("trial-partner"),
    ).rejects.toThrow("missing secret");
  });
});
