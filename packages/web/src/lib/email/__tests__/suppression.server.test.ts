import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailSuppression: { deleteMany: mocks.deleteMany },
  },
}));

import { applyAddressResubscribe } from "../suppression.server";

describe("applyAddressResubscribe", () => {
  it("clears only the requested scope, leaving other suppressed scopes in place", async () => {
    await applyAddressResubscribe({ email: "citizen@example.org", scope: "outreach" });

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { email: "citizen@example.org", scope: "outreach" },
    });
  });

  it("clears the master scope when resubscribing to master", async () => {
    await applyAddressResubscribe({ email: "citizen@example.org", scope: "all" });

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { email: "citizen@example.org", scope: "all" },
    });
  });
});
