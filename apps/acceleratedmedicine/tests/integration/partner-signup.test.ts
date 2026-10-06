import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../app/api/partner-signup/route";
import { prisma } from "../../lib/prisma";

const keys = Array.from(
  { length: 6 },
  (_, index) => `7a2c1e44-5b6d-4000-8000-${String(index).padStart(12, "0")}`,
);
const signup = {
  submissionKey: keys[0],
  type: "clinic",
  name: "Integration Clinician",
  email: "clinician@example.invalid",
  organization: "Integration Clinic",
  message: "Integration test sign-up",
  companyWebsite: "",
};

// Record the alerts without sending them.
const resendEndpoint = "https://api.resend.com/emails";
const sentEmails: Array<{ idempotencyKey: string | null }> = [];
const resend = setupServer(
  http.post(resendEndpoint, ({ request }) => {
    sentEmails.push({ idempotencyKey: request.headers.get("idempotency-key") });
    return HttpResponse.json({ id: `email_${sentEmails.length}` });
  }),
);

function submit(body: unknown) {
  return POST(new Request("http://localhost/api/partner-signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-vercel-forwarded-for": "192.0.2.43",
    },
    body: JSON.stringify(body),
  }));
}

async function removeTestSignups() {
  await prisma.formResponse.deleteMany({
    where: { submission: { idempotencyKey: { in: keys } } },
  });
  await prisma.formSubmission.deleteMany({
    where: { idempotencyKey: { in: keys } },
  });
}

beforeAll(() => {
  vi.stubEnv("RIGHT_TO_TRY_RATE_LIMIT_SECRET", "partner-signup-integration-test-secret");
  vi.stubEnv("RESEND_API_KEY", "re_test_partner_signup");
  resend.listen({ onUnhandledRequest: "error" });
});
beforeEach(async () => {
  sentEmails.length = 0;
  resend.resetHandlers();
  await removeTestSignups();
});
afterAll(async () => {
  try {
    await removeTestSignups();
  } finally {
    resend.close();
    await prisma.$disconnect();
    vi.unstubAllEnvs();
  }
});

describe("Partner sign-up POST with PostgreSQL", () => {
  it("stores a retried sign-up once and sends both alerts with one idempotency key", async () => {
    const first = await submit(signup);
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ ok: true, notified: true });

    const saved = await prisma.formSubmission.findFirstOrThrow({
      where: { idempotencyKey: signup.submissionKey },
      include: {
        formRevision: { select: { form: { select: { sourceKey: true } } } },
        responses: { include: { field: { select: { key: true } } } },
      },
    });
    expect(saved.formRevision.form.sourceKey).toBe("acceleratedmedicine:partner-signup");
    expect(Object.fromEntries(saved.responses.map((item) => [item.field.key, item.valueJson])))
      .toMatchObject({
        type: "clinic",
        name: "Integration Clinician",
        email: "clinician@example.invalid",
        organization: "Integration Clinic",
        message: "Integration test sign-up",
      });

    // Resend delivers one email per idempotency key, so the retry's alert is not a second email.
    const retry = await submit(signup);
    expect(retry.status).toBe(200);
    expect(await prisma.formSubmission.count({
      where: { idempotencyKey: signup.submissionKey },
    })).toBe(1);
    expect(sentEmails).toEqual([
      { idempotencyKey: `partner-signup/${signup.submissionKey}` },
      { idempotencyKey: `partner-signup/${signup.submissionKey}` },
    ]);
  });

  it("delivers the alert on retry when the first alert failed", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    resend.use(
      http.post(
        resendEndpoint,
        () => HttpResponse.json(
          { name: "application_error", message: "Unavailable", statusCode: 500 },
          { status: 500 },
        ),
        { once: true },
      ),
    );

    try {
      expect((await submit(signup)).status).toBe(503);
      const retry = await submit(signup);
      expect(retry.status).toBe(200);
      await expect(retry.json()).resolves.toEqual({ ok: true, notified: true });
      expect(await prisma.formSubmission.count({
        where: { idempotencyKey: signup.submissionKey },
      })).toBe(1);
      expect(sentEmails).toHaveLength(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("limits one connection to five sign-ups in ten minutes", async () => {
    const responses = await Promise.all(keys.map((submissionKey) =>
      submit({ ...signup, submissionKey }),
    ));
    expect(responses.map((response) => response.status).sort())
      .toEqual([200, 200, 200, 200, 200, 429]);
    expect(await prisma.formSubmission.count({
      where: { idempotencyKey: { in: keys } },
    })).toBe(5);
    expect(sentEmails).toHaveLength(5);
  });
});
