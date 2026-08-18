import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("dashboard referral URL contract", () => {
  it("feeds the dashboard handle-backed user into the top reminder composer", () => {
    const dashboardSource = source(
      "src/components/dashboard/EarthOptimizationDashboardClient.tsx",
    );
    const composerSource = source(
      "src/components/landing/TreatyReminderComposer.tsx",
    );

    expect(dashboardSource).toMatch(/<TreatyReminderComposer[\s\S]*referralUser=\{user\}/);
    expect(dashboardSource).toMatch(/<TreatyReminderComposer[\s\S]*referralBaseUrl=\{baseUrl\}/);

    expect(composerSource).toMatch(/referralUser\?:/);
    expect(composerSource).toMatch(/referralBaseUrl\?:/);
    expect(composerSource).toMatch(
      /buildUserReferralUrl\(\s*referralIdentity,\s*baseUrl\s*\)/,
    );
    expect(composerSource).toMatch(
      /buildUserInviteReferralUrl\([\s\S]*referralIdentity,[\s\S]*created\.inviteToken,[\s\S]*baseUrl/,
    );
  });
});
