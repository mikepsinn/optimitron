import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  externalActionRequestFindFirst: vi.fn(),
  getServerSession: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    externalActionRequest: {
      findFirst: mocks.externalActionRequestFindFirst,
    },
    user: {
      findFirst: mocks.userFindFirst,
    },
  },
}));

import {
  assertGenuineSendAuthorization,
  authorizeOwnerSend,
  isGenuineSendAuthorization,
  type OwnerSendAuthorization,
} from "@/lib/email/outbound-authorization.server";

describe("authorizeOwnerSend", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: { id: "user_session" },
    });
    mocks.userFindFirst.mockResolvedValue({ id: "user_session" });
  });

  it("mints genuine owner authority from a live browser session", async () => {
    const authorization = await authorizeOwnerSend(
      new Request("https://warondisease.org/api/tasks"),
    );

    expect(authorization).toMatchObject({
      kind: "owner",
      userId: "user_session",
    });
    expect(isGenuineSendAuthorization(authorization!)).toBe(true);
    expect(mocks.userFindFirst).toHaveBeenCalledWith({
      where: { deletedAt: null, id: "user_session" },
      select: { id: true },
    });
  });

  it("refuses Bearer requests even when a session cookie also resolves", async () => {
    const authorization = await authorizeOwnerSend(
      new Request("https://warondisease.org/api/tasks", {
        headers: { Authorization: "bearer oauth_access_token" },
      }),
    );

    expect(authorization).toBeNull();
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("returns no owner authority without a live session user", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(
      authorizeOwnerSend(new Request("https://warondisease.org/api/tasks")),
    ).resolves.toBeNull();
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("rejects a hand-built owner object at the send boundary", () => {
    const forged = {
      kind: "owner",
      userId: "user_claimed",
    } as unknown as OwnerSendAuthorization;

    expect(isGenuineSendAuthorization(forged)).toBe(false);
    expect(() => assertGenuineSendAuthorization(forged)).toThrow(
      /not genuinely minted/,
    );
  });
});
