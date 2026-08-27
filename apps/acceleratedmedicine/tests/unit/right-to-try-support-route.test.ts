import { describe, expect, it, vi } from "vitest";

import { createPostHandler } from "../../lib/right-to-try-support-route";
import { RightToTryRateLimitError } from "../../lib/right-to-try-support-store";

const validResponse = {
  submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
  state: "Missouri",
  position: "yes",
  role: "patient-or-caregiver",
  email: "",
  story: "",
  updates: false,
  companyWebsite: "",
};

function makeRequest(body: unknown) {
  return new Request("https://acceleratedmedicine.org/api/right-to-try-support", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const clientKeyForRequest = () => "0".repeat(64);

describe("Right to Try support POST", () => {
  it("returns 400 before submission for invalid input", async () => {
    const submit = vi.fn();
    const post = createPostHandler({ clientKeyForRequest, submit });
    const response = await post(makeRequest({ ...validResponse, state: "" }));

    expect(response.status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });

  it("returns 429 when the shared store rejects the quota", async () => {
    const post = createPostHandler({
      clientKeyForRequest,
      submit: async () => {
        throw new RightToTryRateLimitError();
      },
    });
    const response = await post(makeRequest(validResponse));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("returns 503 when durable storage fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const post = createPostHandler({
      clientKeyForRequest,
      submit: async () => {
        throw new Error("database unavailable");
      },
    });

    try {
      const response = await post(makeRequest(validResponse));
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ ok: false });
    } finally {
      consoleError.mockRestore();
    }
  });
});
