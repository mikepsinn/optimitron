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
        subject: "Log in to end war and disease",
        text: expect.stringContaining("Please log in to end war and disease."),
        html: expect.stringContaining("Please log in to end war and disease."),
      }),
    );
  });

  it("uses direct War on Disease copy for War on Disease sign-ins", async () => {
    await sendMagicLinkEmail({
      identifier: "voter@example.org",
      theme: {},
      url: "https://warondisease.local/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Log in to end war and disease",
        text: expect.stringContaining("Please log in to end war and disease."),
        html: expect.stringContaining("Please log in to end war and disease."),
      }),
    );
  });

  it("uses Earth Optimization Services as the Optimitron sender", async () => {
    await sendMagicLinkEmail({
      identifier: "manager@example.org",
      theme: {},
      url: "https://optimitron.local/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendResendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Earth Optimization Services <hello@updates.warondisease.org>",
        subject: "Sign in to optimitron.local",
        text: expect.stringContaining("Sign in to Optimitron."),
        html: expect.stringContaining("Sign in to Optimitron."),
      }),
    );
  });
});
