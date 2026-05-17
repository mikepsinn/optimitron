import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  sendReactEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUser,
    },
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendReactEmail: mocks.sendReactEmail,
}));

import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    mocks.findUser.mockReset();
    mocks.sendReactEmail.mockReset();
    mocks.findUser.mockResolvedValue({ id: "user_123" });
    mocks.sendReactEmail.mockResolvedValue({ status: "sent" });
  });

  it("sends War on Disease vote-save links without the Wishonia signature", async () => {
    await sendMagicLinkEmail({
      identifier: "human@example.com",
      url: "https://warondisease.org/api/auth/callback/email?token=SAMPLE",
    } as Parameters<typeof sendMagicLinkEmail>[0]);

    expect(mocks.sendReactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        skipWishoniaSignature: true,
        subject: "Save your 1% Treaty vote",
      }),
    );
  });
});
