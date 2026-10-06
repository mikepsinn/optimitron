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
  buildPartnerSignupNotification,
  sendPartnerSignup,
} from "../../lib/partner-signup";

const sentMessages: unknown[] = [];
const resendEndpoint = "https://api.resend.com/emails";

const validSignup = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  type: "advisory-board" as const,
  name: "Ada Ethicist",
  email: "ada@example.com",
  organization: "Example University",
  message: "I review trial consent forms.",
  companyWebsite: "",
};

const server = setupServer(
  http.post(resendEndpoint, async ({ request }) => {
    sentMessages.push(await request.json());
    return HttpResponse.json({ id: `email_${sentMessages.length}` });
  }),
);

describe("Partner sign-up submission", () => {
  const store = vi.fn(async () => ({
    created: true,
    submissionId: "submission_1",
  }));
  const options = { clientKey: "0".repeat(64), store };

  beforeAll(() => {
    vi.stubEnv("EMAIL_FROM_ADDRESS", "no-reply@updates.dfda.earth");
    vi.stubEnv("RESEND_API_KEY", "re_test_partner_signup");
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    sentMessages.length = 0;
    store.mockClear();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
    vi.unstubAllEnvs();
  });

  it("stores the sign-up and emails it to the Institute with the sender as reply-to", async () => {
    await expect(sendPartnerSignup(validSignup, options)).resolves.toEqual({
      notified: true,
    });

    expect(store).toHaveBeenCalledOnce();
    expect(sentMessages).toEqual([
      expect.objectContaining({
        from: "Institute for Accelerated Medicine <no-reply@updates.dfda.earth>",
        reply_to: "ada@example.com",
        subject: "[Partner sign-up] Advisory board: Ada Ethicist (Example University)",
        to: "hello@acceleratedmedicine.org",
      }),
    ]);
  });

  it("does not email a retry of a sign-up that is already stored", async () => {
    store.mockResolvedValueOnce({ created: false, submissionId: "submission_1" });

    await expect(sendPartnerSignup(validSignup, options)).resolves.toEqual({
      notified: false,
    });
    expect(sentMessages).toHaveLength(0);
  });

  it("does not store or email honeypot submissions", async () => {
    await expect(
      sendPartnerSignup(
        { ...validSignup, companyWebsite: "https://spam.example" },
        options,
      ),
    ).resolves.toEqual({ notified: false });

    expect(store).not.toHaveBeenCalled();
    expect(sentMessages).toHaveLength(0);
  });

  it("keeps the stored sign-up when the email provider rejects the alert", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    server.use(
      http.post(resendEndpoint, () =>
        HttpResponse.json(
          { name: "validation_error", message: "Rejected", statusCode: 422 },
          { status: 422 },
        ),
      ),
    );

    try {
      await expect(sendPartnerSignup(validSignup, options)).resolves.toEqual({
        notified: false,
      });
      expect(store).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("rejects a sign-up without a name or email before storing it", async () => {
    await expect(
      sendPartnerSignup({ ...validSignup, name: " " }, options),
    ).rejects.toThrow();
    await expect(
      sendPartnerSignup({ ...validSignup, email: "" }, options),
    ).rejects.toThrow();
    expect(store).not.toHaveBeenCalled();
  });

  it("escapes the sender's text in the HTML alert", () => {
    const notification = buildPartnerSignupNotification({
      ...validSignup,
      message: "<script>alert('nope')</script>",
    });

    expect(notification.html).toContain(
      "&lt;script&gt;alert(&#039;nope&#039;)&lt;/script&gt;",
    );
    expect(notification.html).not.toContain("<script>");
  });
});
