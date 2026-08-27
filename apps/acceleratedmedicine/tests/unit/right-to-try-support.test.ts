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
  buildSupportConfirmation,
  buildSupportNotification,
  sendRightToTrySupport,
} from "../../lib/right-to-try-support";

const sentMessages: unknown[] = [];
const resendEndpoint = "https://api.resend.com/emails";
let previousEmailFromAddress: string | undefined;
let previousResendApiKey: string | undefined;

const validResponse = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  intent: "state-support" as const,
  name: "",
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

describe("Right to Trial participation submission", () => {
  const store = vi.fn(async () => ({ submissionId: "submission_1" }));
  const submissionOptions = {
    clientKey: "0".repeat(64),
    store,
  };

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
    await expect(
      sendRightToTrySupport(validResponse, submissionOptions),
    ).resolves.toEqual({ sentConfirmation: true });

    expect(store).toHaveBeenCalledOnce();
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0]).toEqual(
      expect.objectContaining({
        from: "Institute for Accelerated Medicine <no-reply@updates.dfda.earth>",
        to: "hello@acceleratedmedicine.org",
        reply_to: "patient@example.com",
        subject: "[Right to Trial] Missouri: Supports the proposal",
      }),
    );
    expect(sentMessages[1]).toEqual(
      expect.objectContaining({
        to: "patient@example.com",
        subject: "We recorded your Missouri Right to Trial response",
      }),
    );
  });

  it("records a volunteer offer and sends both volunteer emails", async () => {
    await expect(
      sendRightToTrySupport(
        {
          ...validResponse,
          intent: "volunteer",
          name: "Ada Patient",
          position: undefined,
          role: "researcher",
          story: "I can help define common outcomes.",
        },
        submissionOptions,
      ),
    ).resolves.toEqual({ sentConfirmation: true });

    expect(store).toHaveBeenCalledOnce();
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0]).toEqual(
      expect.objectContaining({
        reply_to: "patient@example.com",
        subject: "[Right to Trial volunteer] Missouri: Researcher",
        to: "hello@acceleratedmedicine.org",
      }),
    );
    expect(sentMessages[1]).toEqual(
      expect.objectContaining({
        subject: "You’re on the Right to Trial team",
        to: "patient@example.com",
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

  it("uses the canonical Montana page in volunteer confirmations", () => {
    const confirmation = buildSupportConfirmation({
      ...validResponse,
      intent: "volunteer",
      name: "Ada Patient",
      position: undefined,
      state: "Montana",
    });

    expect(confirmation.text).toContain(
      "Open your state page: https://acceleratedmedicine.org/montana",
    );
    expect(confirmation.text).not.toContain("/states/montana");
  });

  it("does not deliver honeypot submissions", async () => {
    await expect(
      sendRightToTrySupport(
        {
          ...validResponse,
          companyWebsite: "https://spam.example",
        },
        submissionOptions,
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

    await expect(
      sendRightToTrySupport(validResponse, submissionOptions),
    ).resolves.toEqual({ sentConfirmation: false });
    expect(store).toHaveBeenCalledOnce();
  });

  it("keeps the stored response when only the confirmation email fails", async () => {
    let requestNumber = 0;
    server.use(
      http.post(resendEndpoint, async ({ request }) => {
        sentMessages.push(await request.json());
        requestNumber += 1;
        if (requestNumber === 2) {
          return HttpResponse.json(
            {
              name: "validation_error",
              message: "Confirmation rejected",
              statusCode: 422,
            },
            { status: 422 },
          );
        }
        return HttpResponse.json({ id: "email_notification" });
      }),
    );

    await expect(
      sendRightToTrySupport(validResponse, submissionOptions),
    ).resolves.toEqual({ sentConfirmation: false });
    expect(store).toHaveBeenCalledOnce();
    expect(sentMessages).toHaveLength(2);
  });

  it("requires an email address when the supporter requests updates", async () => {
    await expect(
      sendRightToTrySupport(
        { ...validResponse, email: "", updates: true },
        submissionOptions,
      ),
    ).rejects.toThrow();
    expect(store).not.toHaveBeenCalled();
  });

  it("requires an email address for volunteer offers", async () => {
    await expect(
      sendRightToTrySupport(
        {
          ...validResponse,
          email: "",
          intent: "volunteer",
          name: "Ada Patient",
          position: undefined,
        },
        submissionOptions,
      ),
    ).rejects.toThrow();
    expect(store).not.toHaveBeenCalled();
  });

  it("subscribes the contact to the updates audience only with consent", async () => {
    const contactRequests: unknown[] = [];
    process.env.RESEND_AUDIENCE_ID = "aud_test";
    server.use(
      http.post(
        "https://api.resend.com/audiences/aud_test/contacts",
        async ({ request }) => {
          contactRequests.push(await request.json());
          return HttpResponse.json({ object: "contact", id: "contact_1" });
        },
      ),
    );

    try {
      await expect(
        sendRightToTrySupport(validResponse, submissionOptions),
      ).resolves.toEqual({ sentConfirmation: true });
      expect(contactRequests).toEqual([
        expect.objectContaining({
          email: "patient@example.com",
          unsubscribed: false,
        }),
      ]);

      contactRequests.length = 0;
      sentMessages.length = 0;
      await expect(
        sendRightToTrySupport(
          { ...validResponse, updates: false },
          submissionOptions,
        ),
      ).resolves.toEqual({ sentConfirmation: true });
      expect(contactRequests).toHaveLength(0);
    } finally {
      delete process.env.RESEND_AUDIENCE_ID;
    }
  });

  it("flags legislator responses in the notification subject", () => {
    const notification = buildSupportNotification({
      ...validResponse,
      role: "state-legislator-or-staff",
    });

    expect(notification.subject).toBe(
      "[Right to Trial LEGISLATOR] Missouri: Supports the proposal",
    );
  });

  it("keeps the stored response when email delivery is not configured", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    delete process.env.RESEND_API_KEY;

    try {
      await expect(
        sendRightToTrySupport(validResponse, submissionOptions),
      ).resolves.toEqual({ sentConfirmation: false });
      expect(store).toHaveBeenCalledOnce();
      expect(sentMessages).toHaveLength(0);
    } finally {
      process.env.RESEND_API_KEY = apiKey;
      consoleError.mockRestore();
    }
  });
});
