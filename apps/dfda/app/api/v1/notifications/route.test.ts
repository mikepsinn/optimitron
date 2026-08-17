import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionAuthMock } = vi.hoisted(() => ({
  requireSessionAuthMock: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: requireSessionAuthMock,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@optimitron/tracking", () => ({
  setTrackingPrismaProvider: vi.fn(),
  listTrackingReminderNotificationsForUser: vi.fn(),
  respondToTrackingReminderForUser: vi.fn(),
  respondToTrackingReminderNotificationsForUser: vi.fn(),
}));

import {
  listTrackingReminderNotificationsForUser,
  respondToTrackingReminderForUser,
  respondToTrackingReminderNotificationsForUser,
} from "@optimitron/tracking";

import { POST as RESPOND } from "./respond/route";
import { GET } from "./route";

const BASE = "http://localhost:3011/api/v1/notifications";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("REST v1 notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSessionAuthMock.mockResolvedValue({
      userId: "user-1",
      userEmail: "user-1@example.com",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    requireSessionAuthMock.mockRejectedValue(
      new Error("Unauthorized - authentication required"),
    );
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
    expect(listTrackingReminderNotificationsForUser).not.toHaveBeenCalled();
  });

  it("GET passes date and compact filters through for the session user", async () => {
    vi.mocked(listTrackingReminderNotificationsForUser).mockResolvedValue({
      dateKey: "2026-08-14",
      notifications: [],
      timeZone: "UTC",
    });
    const res = await GET(
      new Request(`${BASE}?dateKey=2026-08-14&compact=true&status=PENDING`),
    );
    expect(res.status).toBe(200);
    expect(listTrackingReminderNotificationsForUser).toHaveBeenCalledWith(
      { compact: true, dateKey: "2026-08-14", status: "PENDING" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      dateKey: "2026-08-14",
      notifications: [],
      timeZone: "UTC",
    });
  });

  it("POST respond with trackingReminderId answers the single reminder", async () => {
    vi.mocked(respondToTrackingReminderForUser).mockResolvedValue({
      reminderId: "r1",
    });
    const res = await RESPOND(
      jsonRequest(`${BASE}/respond`, {
        status: "TRACKED",
        trackingReminderId: "r1",
        value: 1,
      }),
    );
    expect(res.status).toBe(200);
    expect(respondToTrackingReminderForUser).toHaveBeenCalledWith(
      { status: "TRACKED", trackingReminderId: "r1", value: 1 },
      "user-1",
    );
    expect(respondToTrackingReminderNotificationsForUser).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      result: { reminderId: "r1" },
    });
  });

  it("POST respond without trackingReminderId answers the batch", async () => {
    vi.mocked(respondToTrackingReminderNotificationsForUser).mockResolvedValue({
      answeredCount: 2,
      failed: [],
    });
    const res = await RESPOND(
      jsonRequest(`${BASE}/respond`, { defaultStatus: "TRACKED" }),
    );
    expect(res.status).toBe(200);
    expect(respondToTrackingReminderNotificationsForUser).toHaveBeenCalledWith(
      { defaultStatus: "TRACKED" },
      "user-1",
    );
    expect(respondToTrackingReminderForUser).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ answeredCount: 2, failed: [] });
  });
});
