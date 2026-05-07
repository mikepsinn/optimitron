import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationUpdate: vi.fn(),
  requireAuth: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: {
      create: mocks.activityCreate,
    },
    organization: {
      findUnique: mocks.organizationFindUnique,
      update: mocks.organizationUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { PATCH } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/organizations/org_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function params() {
  return { params: Promise.resolve({ id: "org_1" }) };
}

describe("PATCH /api/admin/organizations/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({
      userEmail: "admin@example.org",
      userId: "admin_1",
    });
    mocks.userFindUnique.mockResolvedValue({ isAdmin: true });
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      name: "Test Org",
    });
    mocks.organizationUpdate.mockResolvedValue({ id: "org_1" });
    mocks.activityCreate.mockResolvedValue({ id: "activity_1" });
  });

  it("rejects unsafe organization media and donation URLs before updating records", async () => {
    const response = await PATCH(
      makeRequest({
        donationUrl: "javascript:alert(1)",
        squareLogoUrl: "data:image/svg+xml,<svg></svg>",
      }) as never,
      params(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid square logo URL",
    });
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("normalizes admin organization URLs before saving", async () => {
    const response = await PATCH(
      makeRequest({
        donationUrl: "HTTPS://Example.ORG/donate#section",
        squareLogoUrl: "HTTPS://Static.WarOnDisease.ORG/logo.webp#tracking",
        website: "HTTPS://Example.ORG/#top",
        wordmarkLogoUrl:
          "HTTPS://Static.WarOnDisease.ORG/wordmark.webp#tracking",
      }) as never,
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: expect.objectContaining({
        donationUrl: "https://example.org/donate",
        squareLogoUrl: "https://static.warondisease.org/logo.webp",
        website: "https://example.org/",
        wordmarkLogoUrl: "https://static.warondisease.org/wordmark.webp",
      }),
    });
  });
});
