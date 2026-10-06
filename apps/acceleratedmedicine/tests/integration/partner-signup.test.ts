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

// Count the alerts without sending them.
const sentEmails: unknown[] = [];
const resend = setupServer(
  http.post("https://api.resend.com/emails", async ({ request }) => {
    sentEmails.push(await request.json());
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
  it("stores a sign-up and emails it once, even when the browser retries", async () => {
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

    const retry = await submit(signup);
    expect(retry.status).toBe(200);
    await expect(retry.json()).resolves.toEqual({ ok: true, notified: false });
    expect(await prisma.formSubmission.count({
      where: { idempotencyKey: signup.submissionKey },
    })).toBe(1);
    expect(sentEmails).toHaveLength(1);
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
