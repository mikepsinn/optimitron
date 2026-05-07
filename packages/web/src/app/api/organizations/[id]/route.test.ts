import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canManageOrganization: vi.fn(),
  organizationUpdate: vi.fn(),
  requireAuth: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/organization.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/organization.server")
  >("@/lib/organization.server");
  return {
    ...actual,
    canManageOrganization: mocks.canManageOrganization,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      update: mocks.organizationUpdate,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { PATCH } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/organizations/org_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/organizations/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.canManageOrganization.mockResolvedValue(true);
    mocks.organizationUpdate.mockResolvedValue({ id: "org_1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unsafe square logo URLs before updating records", async () => {
    const response = await PATCH(
      makeRequest({ squareLogoUrl: "javascript:alert(1)" }) as never,
      {
        params: Promise.resolve({ id: "org_1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid square logo URL",
    });
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("rejects unsafe wordmark logo URLs before updating records", async () => {
    const response = await PATCH(
      makeRequest({ wordmarkLogoUrl: "data:image/svg+xml,<svg></svg>" }) as never,
      {
        params: Promise.resolve({ id: "org_1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid wordmark logo URL",
    });
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("rejects unsafe website URLs before updating records", async () => {
    const response = await PATCH(
      makeRequest({ website: "javascript:alert(1)" }) as never,
      {
        params: Promise.resolve({ id: "org_1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid website URL",
    });
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("updates organization brand and donation URLs", async () => {
    const response = await PATCH(
      makeRequest({
        donationUrl: "https://example.org/donate",
        squareLogoUrl:
          "https://static.warondisease.org/organizations/logos/2026-05-07/logo.webp",
        wordmarkLogoUrl:
          "https://static.warondisease.org/organizations/wordmarks/2026-05-07/wordmark.webp",
      }) as never,
      {
        params: Promise.resolve({ id: "org_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: expect.objectContaining({
        donationUrl: "https://example.org/donate",
        squareLogoUrl:
          "https://static.warondisease.org/organizations/logos/2026-05-07/logo.webp",
        wordmarkLogoUrl:
          "https://static.warondisease.org/organizations/wordmarks/2026-05-07/wordmark.webp",
      }),
    });
  });
});
