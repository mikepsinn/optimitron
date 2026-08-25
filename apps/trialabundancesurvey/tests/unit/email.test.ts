import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { sendSignupConfirmationEmail } from "../../../../packages/site-kit/src/lib/email";

const sentMessages: unknown[] = [];
const resendEndpoint = "https://api.resend.com/emails";

const server = setupServer(
  http.post(resendEndpoint, async ({ request }) => {
    sentMessages.push(await request.json());
    return HttpResponse.json({ id: "email_123" });
  }),
);

describe("survey verification email", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    sentMessages.length = 0;
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("delivers the branded survey confirmation through the Resend boundary", async () => {
    const result = await sendSignupConfirmationEmail({
      to: "patient@example.com",
      url: "https://trialabundancesurvey.org/api/auth/callback/email?token=test&email=patient%40example.com",
      userName: "Pat",
      orgName: "Global Clinical Trial Abundance Survey",
    });

    expect(result).toEqual({ success: true, data: { id: "email_123" } });
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]).toEqual(
      expect.objectContaining({
        from: "Survey Team <no-reply@updates.dfda.earth>",
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
    server.use(
      http.post(resendEndpoint, () =>
        HttpResponse.json(
          {
            name: "validation_error",
            message: "Sender domain is not verified",
            statusCode: 422,
          },
          { status: 422 },
        ),
      ),
    );

    await expect(
      sendSignupConfirmationEmail({
        to: "patient@example.com",
        url: "https://trialabundancesurvey.org/api/auth/callback/email?token=test",
      }),
    ).rejects.toThrow("Verification email provider rejected the request");
  });
});
