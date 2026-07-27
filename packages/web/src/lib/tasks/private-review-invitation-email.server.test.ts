import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/url", () => ({
  getBaseUrl: () => "https://optimitron.test",
}));

import {
  buildPrivateReviewInvitationEmail,
  getPrivateReviewSignInUrl,
} from "./private-review-invitation-email.server";

describe("private review invitation email", () => {
  it("routes through normal sign-in and returns to the assigned task", () => {
    const url = new URL(getPrivateReviewSignInUrl("task_private_1"));
    expect(url.origin).toBe("https://optimitron.test");
    expect(url.pathname).toBe("/auth/signin");
    expect(url.searchParams.get("callbackUrl")).toBe("/tasks/task_private_1");
  });

  it("contains no document title, body, filename, or revision content", () => {
    const email = buildPrivateReviewInvitationEmail({
      kind: "INVITATION",
      recipientName: "Ada Reviewer",
      signInUrl:
        "https://optimitron.test/auth/signin?callbackUrl=%2Ftasks%2Ftask_private_1",
    });

    expect(email.subject).toBe("Private document review invitation");
    expect(email.text).toContain("independently review a private document");
    expect(email.text).toContain("Sign in with this email address");
    expect(email.text).not.toContain("Certificate of Incorporation");
    expect(email.text).not.toContain("secret clause");
    expect(email.html).toContain("Sign in to see the review assignment");
  });
});
