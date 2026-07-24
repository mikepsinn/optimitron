import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentVisibility, OrgStatus } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  createOrganizationWithOwner: vi.fn(),
  requireAuth: vi.fn(),
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
    createOrganizationWithOwner: mocks.createOrganizationWithOwner,
  };
});

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

  it("creates approved organizations through the owner-creating helper", async () => {
    mocks.requireAuth.mockResolvedValue({
      userId: "user_1",
      userEmail: "owner@example.com",
    });
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_1",
      name: "Test Org",
      status: OrgStatus.APPROVED,
      visibility: ContentVisibility.PUBLIC,
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
        status: OrgStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
        website: "https://example.org/",
      }),
      "user_1",
      { rejectDuplicates: false },
    );
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  it("creates a private organization when requested", async () => {
    mocks.requireAuth.mockResolvedValue({
      userId: "user_1",
      userEmail: "owner@example.com",
    });
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_private",
      name: "Private Org",
      status: OrgStatus.APPROVED,
      visibility: ContentVisibility.PRIVATE,
    });

    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Private Org",
          visibility: ContentVisibility.PRIVATE,
        }),
      }) as never,
    );

    expect(response.status).toBe(201);
    expect(mocks.createOrganizationWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Private Org",
        visibility: ContentVisibility.PRIVATE,
      }),
      "user_1",
      { rejectDuplicates: false },
    );
  });

  it("rejects an invalid organization visibility", async () => {
    mocks.requireAuth.mockResolvedValue({
      userId: "user_1",
      userEmail: "owner@example.com",
    });

    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Org", visibility: "SECRET" }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
  });

  it("rejects unsafe organization website URLs before creating records", async () => {
    mocks.requireAuth.mockResolvedValue({
      userId: "user_1",
      userEmail: "owner@example.com",
    });

    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Org",
          website: "javascript:alert(1)",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Invalid website URL",
    });
  });
});
