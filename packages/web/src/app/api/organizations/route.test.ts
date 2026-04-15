import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrganizationWithOwner: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/organization.server", () => ({
  createOrganizationWithOwner: mocks.createOrganizationWithOwner,
}));

import { POST } from "./route";

describe("organizations route", () => {
  beforeEach(() => {
    mocks.createOrganizationWithOwner.mockReset();
    mocks.requireAuth.mockReset();
  });

  it("returns 401 when creating an organization without auth", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Org" }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates pending organizations through the owner-creating helper", async () => {
    mocks.requireAuth.mockResolvedValue({
      userId: "user_1",
      userEmail: "owner@example.com",
    });
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_1",
      name: "Test Org",
      status: "PENDING",
    });

    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Org",
          website: "https://example.org",
        }),
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createOrganizationWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: "owner@example.com",
        name: "Test Org",
        website: "https://example.org",
      }),
      "user_1",
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });
});
