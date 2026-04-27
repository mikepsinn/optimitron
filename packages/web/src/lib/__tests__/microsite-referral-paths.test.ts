import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/middleware", () => ({
  withAuth: (handler: unknown) => handler,
}));

import { isMicrositeAllowed } from "@/middleware";

describe("microsite referral paths", () => {
  it("allows recipient invite-token redirect paths on the treaty host", () => {
    expect(isMicrositeAllowed("/vote")).toBe(true);
    expect(isMicrositeAllowed("/vote/ada")).toBe(true);
    expect(isMicrositeAllowed("/vote/ada?invite=invite_token")).toBe(true);
    expect(isMicrositeAllowed("/r/ada")).toBe(true);
  });
});
