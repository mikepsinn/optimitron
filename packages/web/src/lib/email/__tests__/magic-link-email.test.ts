import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  sendResendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUser,
    },
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendResendEmail: mocks.sendResendEmail,
}));

import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    mocks.findUser.mockReset();
    mocks.findUser.mockResolvedValue(null);
    mocks.sendResendEmail.mockReset();
    mocks.sendResendEmail.mockResolvedValue({ status: "sent" });
  });

  it("uses War on Disease copy for legacy Trial Abundance Survey sign-ins", async () => {
    await sendMagicLinkEmail({
      identifier: "partner@example.org",
      theme: {},
      url: "https://trialabundancesurvey.org/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Sign in to trialabundancesurvey.org",
        text: expect.stringContaining("Yeahhh, here's your sign-in link. Mmkay."),
        html: expect.stringContaining("Yeahhh, here&#39;s your sign-in link. Mmkay."),
      }),
    );
  });

  it("keeps Lumbergh copy for War on Disease sign-ins", async () => {
    await sendMagicLinkEmail({
      identifier: "voter@example.org",
      theme: {},
      url: "https://warondisease.local/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Sign in to warondisease.local",
        text: expect.stringContaining("Yeahhh, here's your sign-in link. Mmkay."),
        html: expect.stringContaining("Yeahhh, here&#39;s your sign-in link. Mmkay."),
      }),
    );
  });
});
