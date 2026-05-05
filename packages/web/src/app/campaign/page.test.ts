import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/routes";

const mocks = vi.hoisted(() => ({
  permanentRedirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect: mocks.permanentRedirect,
}));

import LegacyCampaignPage from "./page";

describe("LegacyCampaignPage", () => {
  it("preserves referral and UTM query parameters", async () => {
    await expect(
      LegacyCampaignPage({
        searchParams: Promise.resolve({
          empty: undefined,
          ref: "alice",
          utm_campaign: ["launch", "followup"],
        }),
      }),
    ).rejects.toThrow(
      `redirect:${ROUTES.signatories}?ref=alice&utm_campaign=launch&utm_campaign=followup`,
    );
  });
});
