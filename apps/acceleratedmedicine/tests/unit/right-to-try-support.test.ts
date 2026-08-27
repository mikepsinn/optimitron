import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildSupportNotification,
  sendRightToTrySupport,
} from "../../lib/right-to-try-support";

const sentMessages: unknown[] = [];
const resendEndpoint = "https://api.resend.com/emails";
let previousEmailFromAddress: string | undefined;
let previousResendApiKey: string | undefined;

const validResponse = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  state: "Missouri",
  position: "yes" as const,
  role: "patient-or-caregiver" as const,
  email: "patient@example.com",
  story: "My family needs more lawful options.",
  updates: true,
  companyWebsite: "",
};

const server = setupServer(
  http.post(resendEndpoint, async ({ request }) => {
    sentMessages.push(await request.json());
    return HttpResponse.json({ id: `email_${sentMessages.length}` });
  }),
);

describe("Universal Right to Try support submission", () => {
  const store = vi.fn(async () => ({ submissionId: "submission_1" }));

  beforeAll(() => {
    previousEmailFromAddress = process.env.EMAIL_FROM_ADDRESS;
    previousResendApiKey = process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM_ADDRESS = "no-reply@updates.dfda.earth";
    process.env.RESEND_API_KEY = "re_test_right_to_try";
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    sentMessages.length = 0;
    store.mockClear();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    if (previousEmailFromAddress === undefined) {
      delete process.env.EMAIL_FROM_ADDRESS;
    } else {
      process.env.EMAIL_FROM_ADDRESS = previousEmailFromAddress;
    }
    if (previousResendApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousResendApiKey;
    }
  });

  it("records the response with the Institute and confirms it to the supporter", async () => {
    await expect(sendRightToTrySupport(validResponse, store)).resolves.toEqual({
      sentConfirmation: true,
    });

    expect(store).toHaveBeenCalledOnce();
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0]).toEqual(
      expect.objectContaining({
        from: "Institute for Accelerated Medicine <no-reply@updates.dfda.earth>",
        to: "hello@acceleratedmedicine.org",
        reply_to: "patient@example.com",
        subject: "[Right to Try] Missouri: Supports the proposal",
      }),
    );
    expect(sentMessages[1]).toEqual(
      expect.objectContaining({
        to: "patient@example.com",
        subject: "We recorded your Missouri Right to Try response",
      }),
    );
  });

  it("escapes the supporter story in the HTML notification", () => {
    const notification = buildSupportNotification({
      ...validResponse,
      story: "<script>alert('nope')</script>",
    });

    expect(notification.html).toContain(
      "&lt;script&gt;alert(&#039;nope&#039;)&lt;/script&gt;",
    );
    expect(notification.html).not.toContain("<script>");
  });

  it("does not deliver honeypot submissions", async () => {
    await expect(
      sendRightToTrySupport(
        {
          ...validResponse,
          companyWebsite: "https://spam.example",
        },
        store,
      ),
    ).resolves.toEqual({ sentConfirmation: false });

    expect(store).not.toHaveBeenCalled();
    expect(sentMessages).toHaveLength(0);
  });

  it("keeps the stored response when the email provider rejects the notification", async () => {
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

    await expect(sendRightToTrySupport(validResponse, store)).resolves.toEqual({
      sentConfirmation: false,
    });
    expect(store).toHaveBeenCalledOnce();
  });

  it("keeps the stored response when email delivery is not configured", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.RESEND_API_KEY;

    try {
      await expect(sendRightToTrySupport(validResponse, store)).resolves.toEqual({
        sentConfirmation: false,
      });
      expect(store).toHaveBeenCalledOnce();
      expect(sentMessages).toHaveLength(0);
    } finally {
      process.env.RESEND_API_KEY = apiKey;
      consoleError.mockRestore();
    }
  });
});
