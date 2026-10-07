import { describe, expect, it, vi } from "vitest";

import { createFormPostHandler } from "../../lib/form-post-handler";
import { FormSubmissionRateLimitError } from "../../lib/form-submission-store";
import { partnerSignupSchema } from "../../lib/partner-signup";

const validSignup = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  types: ["clinic"],
  name: "Ada Clinician",
  email: "ada@example.com",
  organization: "",
  message: "",
  companyWebsite: "",
};

function makeRequest(body: unknown) {
  return new Request("https://acceleratedmedicine.org/api/partner-signup", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const dependencies = { clientKeyForRequest: () => "0".repeat(64) };

describe("Site form POST", () => {
  it("returns 400 before submission for invalid input", async () => {
    const submit = vi.fn();
    const post = createFormPostHandler(partnerSignupSchema, submit, dependencies);
    const response = await post(makeRequest({ ...validSignup, email: "" }));

    expect(response.status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });

  it("returns 429 when the shared store rejects the quota", async () => {
    const post = createFormPostHandler(
      partnerSignupSchema,
      async () => {
        throw new FormSubmissionRateLimitError();
      },
      dependencies,
    );
    const response = await post(makeRequest(validSignup));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("returns 503 when durable storage fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const post = createFormPostHandler(
      partnerSignupSchema,
      async () => {
        throw new Error("database unavailable");
      },
      dependencies,
    );

    try {
      const response = await post(makeRequest(validSignup));
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ ok: false });
    } finally {
      consoleError.mockRestore();
    }
  });
});
