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
  listTrackingRemindersForUser: vi.fn(),
  upsertTrackingReminderForUser: vi.fn(),
}));

import {
  listTrackingRemindersForUser,
  upsertTrackingReminderForUser,
} from "@optimitron/tracking";

import { DELETE } from "./[id]/route";
import { GET, POST } from "./route";

const BASE = "http://localhost:3011/api/v1/tracking-reminders";

describe("REST v1 tracking reminders", () => {
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
    expect(listTrackingRemindersForUser).not.toHaveBeenCalled();
  });

  it("GET lists reminders for the session user", async () => {
    vi.mocked(listTrackingRemindersForUser).mockResolvedValue([{ id: "r1" }]);
    const res = await GET(new Request(`${BASE}?includeInactive=true`));
    expect(res.status).toBe(200);
    expect(listTrackingRemindersForUser).toHaveBeenCalledWith(
      { includeInactive: true },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({ reminders: [{ id: "r1" }] });
  });

  it("POST upserts a reminder for the session user", async () => {
    vi.mocked(upsertTrackingReminderForUser).mockResolvedValue({
      reminder: { id: "r1" },
      subjectId: "s1",
    });
    const res = await POST(
      new Request(BASE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reminderStartTime: "08:00",
          variableName: "Vitamin D",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(upsertTrackingReminderForUser).toHaveBeenCalledWith(
      { reminderStartTime: "08:00", variableName: "Vitamin D" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      result: { reminder: { id: "r1" }, subjectId: "s1" },
    });
  });

  it("DELETE archives the reminder instead of hard-deleting", async () => {
    vi.mocked(upsertTrackingReminderForUser).mockResolvedValue({
      reminder: { active: false, id: "r1" },
      subjectId: "s1",
    });
    const res = await DELETE(new Request(`${BASE}/r1`, { method: "DELETE" }), {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(200);
    expect(upsertTrackingReminderForUser).toHaveBeenCalledWith(
      { active: false, trackingReminderId: "r1" },
      "user-1",
    );
    await expect(res.json()).resolves.toEqual({
      result: { reminder: { active: false, id: "r1" }, subjectId: "s1" },
    });
  });
});
