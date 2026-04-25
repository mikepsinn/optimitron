import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createReferralInvitation: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  requireAuth: vi.fn(),
  sendReferralInvitationEmail: vi.fn(),
  taskUpdateMany: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referralInvitation: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
    task: {
      updateMany: mocks.taskUpdateMany,
    },
  },
}));

vi.mock("@/lib/referral-invitations.server", () => ({
  createReferralInvitation: mocks.createReferralInvitation,
  sendReferralInvitationEmail: mocks.sendReferralInvitationEmail,
}));

import { GET, PATCH, POST } from "./route";

function makeJsonRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/referral-invitations", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function makePatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/referral-invitations", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
}

describe("/api/referral-invitations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects unauthenticated creates", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(makeJsonRequest({ recipientName: "Jake" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates an authenticated named invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    const invitation = {
      id: "invite_1",
      inviteToken: "token_1",
      recipientName: "Jake",
      recipientEmail: "jake@example.com",
    };
    mocks.createReferralInvitation.mockResolvedValue(invitation);

    const response = await POST(
      makeJsonRequest({
        recipientName: "Jake",
        recipientEmail: "jake@example.com",
        contactMethod: "EMAIL",
        messageFormat: "TASK_NOTIFICATION",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ invitation });
    expect(mocks.createReferralInvitation).toHaveBeenCalledWith({
      referrerUserId: "user_1",
      recipientName: "Jake",
      recipientEmail: "jake@example.com",
      contactMethod: "EMAIL",
      messageFormat: "TASK_NOTIFICATION",
      messageText: undefined,
      referendumSlug: undefined,
      taskId: undefined,
      shareAttemptId: undefined,
    });
  });

  it("validates create payloads", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await POST(makeJsonRequest({ recipientEmail: "not-email" }));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid invitation payload.");
    expect(mocks.createReferralInvitation).not.toHaveBeenCalled();
  });

  it("lists only the current user's invitations", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findMany.mockResolvedValue([{ id: "invite_1" }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitations: [{ id: "invite_1" }],
    });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        referrerUserId: "user_1",
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  it("marks an owned invitation as copied", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: "invite_1", status: "COPIED" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "markCopied",
        messageText: "message",
        shareAttemptId: "share_1",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: { id: "invite_1", status: "COPIED" },
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "invite_1",
        referrerUserId: "user_1",
        deletedAt: null,
        status: "PENDING",
      },
      data: expect.objectContaining({
        status: "COPIED",
        messageText: "message",
        shareAttemptId: "share_1",
      }),
    });
  });

  it("records copy details without downgrading an already-sent invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: "invite_1", status: "SENT" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "markCopied",
        messageText: "message",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: { id: "invite_1", status: "SENT" },
    });
    expect(mocks.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "invite_1",
        referrerUserId: "user_1",
        deletedAt: null,
      },
      data: expect.not.objectContaining({
        status: "COPIED",
      }),
    });
  });

  it("sends an owned invitation email", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationEmail.mockResolvedValue({
      status: "sent",
      invitation: { id: "invite_1", status: "SENT" },
    });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "sendEmail",
        messageText: "edited message",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "sent",
      invitation: { id: "invite_1", status: "SENT" },
    });
    expect(mocks.sendReferralInvitationEmail).toHaveBeenCalledWith({
      invitationId: "invite_1",
      manualInitialOnly: true,
      messageText: "edited message",
      referrerUserId: "user_1",
      now: expect.any(Date),
    });
  });

  it("rejects sending an inactive invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationEmail.mockResolvedValue({
      status: "inactive",
    });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "sendEmail",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "This invitation is no longer active.",
    });
  });

  it("records sender reminder opt-in seven days out", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T12:00:00.000Z"));
    try {
      mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
      mocks.updateMany.mockResolvedValue({ count: 1 });
      mocks.findUnique.mockResolvedValue({
        id: "invite_1",
        nextSenderReminderAt: new Date("2026-05-02T12:00:00.000Z"),
      });

      const response = await PATCH(
        makePatchRequest({
          id: "invite_1",
          action: "senderReminderOptIn",
        }),
      );

      expect(response.status).toBe(200);
      expect(mocks.updateMany).toHaveBeenCalledWith({
        where: {
          id: "invite_1",
          referrerUserId: "user_1",
          deletedAt: null,
        },
        data: {
          senderReminderOptedInAt: new Date("2026-04-25T12:00:00.000Z"),
          nextSenderReminderAt: new Date("2026-05-02T12:00:00.000Z"),
        },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks a cancelled invitation task stale", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.taskUpdateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: "invite_1", status: "CANCELLED" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "cancel",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: { id: "invite_1", status: "CANCELLED" },
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "invite_1",
        referrerUserId: "user_1",
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
        nextRecipientEmailAt: null,
        nextSenderReminderAt: null,
        status: "CANCELLED",
      },
    });
    expect(mocks.taskUpdateMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        referralInvitations: {
          some: {
            id: "invite_1",
            referrerUserId: "user_1",
          },
        },
        status: { not: "VERIFIED" },
      },
      data: expect.objectContaining({
        deletedAt: expect.any(Date),
        status: "STALE",
      }),
    });
  });

  it("marks a declined invitation task stale and clears reminder scheduling", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.taskUpdateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: "invite_1", status: "DECLINED" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "decline",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: { id: "invite_1", status: "DECLINED" },
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "invite_1",
        referrerUserId: "user_1",
        deletedAt: null,
      },
      data: {
        nextRecipientEmailAt: null,
        nextSenderReminderAt: null,
        status: "DECLINED",
      },
    });
    expect(mocks.taskUpdateMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        referralInvitations: {
          some: {
            id: "invite_1",
            referrerUserId: "user_1",
          },
        },
        status: { not: "VERIFIED" },
      },
      data: {
        status: "STALE",
      },
    });
  });

  it("returns 404 when updating another user's invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "markCopied",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Invitation not found.",
    });
  });
});
