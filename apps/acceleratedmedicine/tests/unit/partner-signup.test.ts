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

const sentMessages: Array<{ body: unknown; idempotencyKey: string | null }> = [];
const resendEndpoint = "https://api.resend.com/emails";

const validSignup = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  types: ["advisory-board"],
  name: "Ada Ethicist",
  email: "ada@example.com",
  organization: "Example University",
  message: "I review trial consent forms.",
  companyWebsite: "",
};

const server = setupServer(
  http.post(resendEndpoint, async ({ request }) => {
    sentMessages.push({
      body: await request.json(),
      idempotencyKey: request.headers.get("idempotency-key"),
    });
    return HttpResponse.json({ id: `email_${sentMessages.length}` });
  }),
);

describe("Partner sign-up submission", () => {
  const store = vi.fn(async () => ({ submissionId: "submission_1" }));
  const options = { clientKey: "0".repeat(64), store };

  beforeAll(() => {
    vi.stubEnv("EMAIL_FROM_ADDRESS", "no-reply@updates.acceleratedmedicine.org");
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
      {
        body: expect.objectContaining({
          from: "Institute for Accelerated Medicine <no-reply@updates.acceleratedmedicine.org>",
          reply_to: "ada@example.com",
          subject: "[Partner sign-up] Advisory board: Ada Ethicist (Example University)",
          to: "hello@acceleratedmedicine.org",
        }),
        idempotencyKey: `partner-signup/${validSignup.submissionKey}`,
      },
    ]);
  });

  it("fails the request when the alert is rejected, so the sender's retry sends it", async () => {
    server.use(
      http.post(resendEndpoint, () =>
        HttpResponse.json(
          { name: "application_error", message: "Unavailable", statusCode: 500 },
          { status: 500 },
        ),
      ),
    );

    await expect(sendPartnerSignup(validSignup, options)).rejects.toThrow(
      "The partner sign-up alert was not accepted",
    );
    expect(store).toHaveBeenCalledOnce();
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
