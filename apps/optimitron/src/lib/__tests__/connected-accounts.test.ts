import { describe, expect, it } from "vitest";
import {
  getVisibleConnectedAccountPlatforms,
  getVisibleIdentityAuthProviderIds,
} from "@/lib/connected-accounts";
import type { DashboardSocialAccount } from "@/types/dashboard";

const platforms = [
  { key: "GITHUB", isWallet: false },
  { key: "TWITTER", isWallet: false },
  { key: "DISCORD", isWallet: false },
  { key: "TELEGRAM", isWallet: false },
  { key: "ETHEREUM", isWallet: true },
  { key: "BASE", isWallet: true },
];

describe("getVisibleConnectedAccountPlatforms", () => {
  it("hides unsupported unlinked social platforms while keeping wallets", () => {
    const socialAccounts: DashboardSocialAccount[] = [];

    const result = getVisibleConnectedAccountPlatforms(
      platforms,
      socialAccounts,
      ["email", "google"],
    );

    expect(result.map((platform) => platform.key)).toEqual(["ETHEREUM", "BASE"]);
  });

  it("keeps a linked social account visible even when the provider is unavailable", () => {
    const socialAccounts: DashboardSocialAccount[] = [
      {
        platform: "DISCORD",
        username: "citizen",
        walletAddress: null,
        isPrimary: true,
        verifiedAt: null,
      },
    ];

    const result = getVisibleConnectedAccountPlatforms(
      platforms,
      socialAccounts,
      ["email", "google"],
    );

    expect(result.map((platform) => platform.key)).toEqual([
      "DISCORD",
      "ETHEREUM",
      "BASE",
    ]);
  });

  it("shows social providers that are configured in auth", () => {
    const socialAccounts: DashboardSocialAccount[] = [];

    const result = getVisibleConnectedAccountPlatforms(
      platforms,
      socialAccounts,
      ["email", "github", "discord"],
    );

    expect(result.map((platform) => platform.key)).toEqual([
      "GITHUB",
      "DISCORD",
      "ETHEREUM",
      "BASE",
    ]);
  });
});

describe("getVisibleIdentityAuthProviderIds", () => {
  it("shows supported auth providers when configured", () => {
    expect(
      getVisibleIdentityAuthProviderIds(["email", "google"], []),
    ).toEqual(["google"]);
  });

  it("keeps linked auth providers visible even when no longer configured", () => {
    expect(
      getVisibleIdentityAuthProviderIds(["email"], ["google"]),
    ).toEqual(["google"]);
  });

  it("hides unsupported auth providers", () => {
    expect(
      getVisibleIdentityAuthProviderIds(["email", "github"], []),
    ).toEqual([]);
  });
});
