import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createReferralInvitation: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  markReferralInvitationCopied: vi.fn(),
  requireAuth: vi.fn(),
  sendReferralInvitationMessage: vi.fn(),
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
  markReferralInvitationCopied: mocks.markReferralInvitationCopied,
  sendReferralInvitationMessage: mocks.sendReferralInvitationMessage,
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
    mocks.markReferralInvitationCopied.mockResolvedValue({ id: "invite_1", status: "COPIED" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "markCopied",
        messageText: "message",
        shareAttemptId: "share_1",
        wasEdited: true,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: { id: "invite_1", status: "COPIED" },
    });
    expect(mocks.markReferralInvitationCopied).toHaveBeenCalledWith({
      invitationId: "invite_1",
      contactConfirmed: false,
      messageText: "message",
      referrerUserId: "user_1",
      shareAttemptId: "share_1",
      wasEdited: true,
      now: expect.any(Date),
    });
  });

  it("records copy details without downgrading an already-sent invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.markReferralInvitationCopied.mockResolvedValue({ id: "invite_1", status: "SENT" });

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
    expect(mocks.markReferralInvitationCopied).toHaveBeenCalledWith({
      invitationId: "invite_1",
      contactConfirmed: false,
      messageText: "message",
      referrerUserId: "user_1",
      shareAttemptId: undefined,
      wasEdited: undefined,
      now: expect.any(Date),
    });
  });

  it("marks manual phone/text contact using the copied status without requiring email", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.markReferralInvitationCopied.mockResolvedValue({
      id: "invite_1",
      recipientEmail: null,
      status: "COPIED",
    });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "markManualContacted",
        messageText: "Called Jake with the treaty link.",
        shareAttemptId: "share_manual_1",
        wasEdited: false,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invitation: {
        id: "invite_1",
        recipientEmail: null,
        status: "COPIED",
      },
    });
    expect(mocks.markReferralInvitationCopied).toHaveBeenCalledWith({
      invitationId: "invite_1",
      contactConfirmed: true,
      messageText: "Called Jake with the treaty link.",
      referrerUserId: "user_1",
      shareAttemptId: "share_manual_1",
      wasEdited: false,
      now: expect.any(Date),
    });
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
    mocks.markReferralInvitationCopied.mockResolvedValue(null);

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

  it("dispatches sendMessage to advance the invitation to SENT when notification fires", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationMessage.mockResolvedValue({
      status: "ok",
      dispatched: true,
      invitation: { id: "invite_1", status: "SENT", sentAt: new Date() },
    });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "sendMessage",
        messageText: "Hey Joe, please vote.",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.sendReferralInvitationMessage).toHaveBeenCalledWith({
      invitationId: "invite_1",
      messageText: "Hey Joe, please vote.",
      referrerUserId: "user_1",
      now: expect.any(Date),
    });
    const body = (await response.json()) as {
      dispatched: boolean;
      invitation: { status: string };
      status: string;
    };
    expect(body.status).toBe("sent");
    expect(body.dispatched).toBe(true);
    expect(body.invitation.status).toBe("SENT");
  });

  it("returns 'queued' when sendMessage is rate-limited and leaves status unchanged", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationMessage.mockResolvedValue({
      status: "ok",
      dispatched: false,
      reason: "rate_limited",
      invitation: { id: "invite_1", status: "PENDING", sentAt: null },
    });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "sendMessage",
        messageText: "Hey Joe.",
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      dispatched: boolean;
      invitation: { status: string };
      reason?: string;
      status: string;
    };
    expect(body.status).toBe("queued");
    expect(body.dispatched).toBe(false);
    expect(body.reason).toBe("rate_limited");
    expect(body.invitation.status).toBe("PENDING");
  });

  it("returns 400 when sendMessage targets an invitation without a recipient email", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationMessage.mockResolvedValue({ status: "missing_recipient_email" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_1",
        action: "sendMessage",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "This invitation has no recipient email.",
    });
  });

  it("returns 404 when sendMessage targets a missing invitation", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.sendReferralInvitationMessage.mockResolvedValue({ status: "not_found" });

    const response = await PATCH(
      makePatchRequest({
        id: "invite_missing",
        action: "sendMessage",
      }),
    );

    expect(response.status).toBe(404);
  });
});
