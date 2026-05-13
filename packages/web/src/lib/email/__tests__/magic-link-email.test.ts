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
    mocks.findUser.mockResolvedValue(null);
    mocks.sendReactEmail.mockReset();
    mocks.sendReactEmail.mockResolvedValue({ status: "sent" });
  });

  it("uses War on Disease copy for legacy Trial Abundance Survey sign-ins", async () => {
    await sendMagicLinkEmail({
      identifier: "partner@example.org",
      theme: {},
      url: "https://trialabundancesurvey.org/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendReactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "End war and disease",
        react: expect.objectContaining({
          props: expect.objectContaining({
            buttonLabel: "End war and disease",
          }),
        }),
      }),
    );
  });

  it("uses direct War on Disease copy for War on Disease sign-ins", async () => {
    await sendMagicLinkEmail({
      identifier: "voter@example.org",
      theme: {},
      url: "https://warondisease.local/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendReactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "End war and disease",
        react: expect.objectContaining({
          props: expect.objectContaining({
            buttonLabel: "End war and disease",
          }),
        }),
      }),
    );
  });

  it("uses Earth Optimization Services as the Optimitron sender", async () => {
    await sendMagicLinkEmail({
      identifier: "manager@example.org",
      theme: {},
      url: "https://optimitron.local/api/auth/callback/email?token=abc",
    } as never);

    expect(mocks.sendReactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Earth Optimization Services <hello@updates.warondisease.org>",
        subject: "Sign in to optimitron.local",
        react: expect.objectContaining({
          props: expect.objectContaining({
            buttonLabel: "Sign in",
            intro: "Your sign-in link is below.",
          }),
        }),
      }),
    );
  });
});
