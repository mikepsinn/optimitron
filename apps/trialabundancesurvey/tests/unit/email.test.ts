import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("../../../../packages/site-kit/src/lib/email-utils", () => ({
  getResendClient: () => ({ emails: { send: sendEmail } }),
}));

vi.mock("../../../../packages/site-kit/src/lib/env", () => ({
  env: {
    EMAIL_FROM_ADDRESS: "login@updates.dfda.earth",
  },
}));

vi.mock("../../../../packages/site-kit/src/lib/site-config", () => ({
  getSiteVariant: () => "trialabundancesurvey.org",
  getSiteConfig: () => ({
    emailBranding: {
      fromName: "Survey Team",
      primaryColor: "#000000",
      orgName: "Global Clinical Trial Abundance Survey",
    },
  }),
}));

import { sendSignupConfirmationEmail } from "../../../../packages/site-kit/src/lib/email";

describe("survey verification email", () => {
  beforeEach(() => {
    sendEmail.mockReset();
  });

  it("sends the branded survey confirmation through Resend", async () => {
    sendEmail.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendSignupConfirmationEmail({
      to: "patient@example.com",
      url: "https://trialabundancesurvey.org/api/auth/callback/email?token=test&email=patient%40example.com",
      userName: "Pat",
      orgName: "Global Clinical Trial Abundance Survey",
    });

    expect(result).toEqual({ success: true, data: { id: "email_123" } });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Survey Team <login@updates.dfda.earth>",
        to: "patient@example.com",
        subject: "Confirm your survey submission",
        html: expect.stringContaining("Confirm My Submission"),
        text: expect.stringContaining(
          "Your submission won't be counted until you confirm.",
        ),
      }),
    );
  });

  it("throws when Resend rejects the message instead of reporting success", async () => {
    sendEmail.mockResolvedValue({
      data: null,
      error: {
        name: "validation_error",
        message: "Sender domain is not verified",
      },
    });

    await expect(
      sendSignupConfirmationEmail({
        to: "patient@example.com",
        url: "https://trialabundancesurvey.org/api/auth/callback/email?token=test",
      }),
    ).rejects.toThrow("Verification email provider rejected the request");
  });
});
