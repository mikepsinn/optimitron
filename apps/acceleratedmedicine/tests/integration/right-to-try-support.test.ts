import { createHmac } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../app/api/right-to-try-support/route";
import { prisma } from "../../lib/prisma";

const secret = "right-to-try-integration-test-secret";
const address = "192.0.2.42";
const keys = Array.from(
  { length: 6 },
  (_, index) => `6915f297-a64b-4000-8000-${String(index).padStart(12, "0")}`,
);
const validResponse = {
  submissionKey: keys[0],
  intent: "state-support",
  state: "Missouri",
  position: "yes",
  role: "patient-or-caregiver",
  email: "",
  story: "Integration test response",
  updates: false,
  companyWebsite: "",
};

function submit(body: unknown) {
  return POST(new Request("http://localhost/api/right-to-try-support", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-vercel-forwarded-for": address,
    },
    body: JSON.stringify(body),
  }));
}

async function removeTestResponses() {
  await prisma.formResponse.deleteMany({
    where: { submission: { idempotencyKey: { in: keys } } },
  });
  await prisma.formSubmission.deleteMany({
    where: { idempotencyKey: { in: keys } },
  });
}

beforeAll(() => {
  vi.stubEnv("RIGHT_TO_TRY_RATE_LIMIT_SECRET", secret);
  // Exercise the real store without sending notifications to real recipients.
  vi.stubEnv("RESEND_API_KEY", "");
});
beforeEach(removeTestResponses);
afterAll(async () => {
  try {
    await removeTestResponses();
  } finally {
    await prisma.$disconnect();
    vi.unstubAllEnvs();
  }
});

describe("Right to Try POST with PostgreSQL", () => {
  it.each([
    { intent: "state-support", name: "", email: "", position: "yes" },
    { intent: "volunteer", name: "Test Volunteer", email: "volunteer@example.invalid", position: undefined },
  ])("persists a $intent response and deduplicates a retry", async (participant) => {
    const input = { ...validResponse, ...participant };
    const response = await submit(input);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, sentConfirmation: false });

    const saved = await prisma.formSubmission.findFirstOrThrow({
      where: { idempotencyKey: input.submissionKey },
      include: { responses: { include: { field: { select: { key: true } } } } },
    });
    expect(saved.status).toBe("SUBMITTED");
    expect(Object.fromEntries(saved.responses.map((item) => [item.field.key, item.valueJson])))
      .toEqual({
        intent: input.intent,
        name: input.name,
        state: input.state,
        position: input.position || "",
        role: input.role,
        story: input.story,
        email: input.email,
        updates: false,
        "client-key": createHmac("sha256", secret).update(address).digest("hex"),
      });

    expect((await submit(input)).status).toBe(200);
    expect(await prisma.formSubmission.count({
      where: { idempotencyKey: input.submissionKey },
    })).toBe(1);
  });

  it("enforces the quota across concurrent submissions and still accepts retries", async () => {
    const responses = await Promise.all(keys.map((submissionKey) =>
      submit({ ...validResponse, submissionKey }),
    ));
    expect(responses.map((response) => response.status).sort())
      .toEqual([200, 200, 200, 200, 200, 429]);
    expect(await prisma.formSubmission.count({
      where: { idempotencyKey: { in: keys } },
    })).toBe(5);

    const acceptedKey = keys[responses.findIndex((response) => response.status === 200)];
    expect((await submit({ ...validResponse, submissionKey: acceptedKey })).status).toBe(200);
  });
});
