import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  prepareReasoningSession: vi.fn(),
  resolveLocale: vi.fn(),
  verifyOrgContextToken: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/components/reasoning/ReasoningFlow", () => ({
  ReasoningFlow: () => null,
}));

vi.mock("@/lib/organization-context-token.server", () => ({
  verifyOrgContextToken: mocks.verifyOrgContextToken,
}));

vi.mock("@/lib/reasoning/locale.server", () => ({
  resolveLocale: mocks.resolveLocale,
}));

vi.mock("@/lib/reasoning/session.server", () => ({
  prepareReasoningSession: mocks.prepareReasoningSession,
}));

import EmbedPage from "./page";

describe("EmbedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    mocks.headers.mockResolvedValue(
      new Headers({
        "accept-language": "en-US",
        host: "warondisease.org",
        "user-agent": "vitest",
      }),
    );
    mocks.resolveLocale.mockResolvedValue({ localeKey: "en-US" });
    mocks.prepareReasoningSession.mockResolvedValue({
      arms: [],
      session: { id: "session-1" },
      signatureCount: 0,
    });
  });

  it("prepares a neutral public embed when no org token is present", async () => {
    await EmbedPage({ searchParams: Promise.resolve({}) });

    expect(mocks.verifyOrgContextToken).not.toHaveBeenCalled();
    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: null,
        orgContextToken: null,
        orgContextVerified: false,
        surface: "embed",
      }),
    );
  });

  it("falls back to neutral public context when the org token is invalid", async () => {
    mocks.verifyOrgContextToken.mockReturnValue({
      ok: false,
      reason: "bad-signature",
    });

    await EmbedPage({
      searchParams: Promise.resolve({ token: "tampered-token" }),
    });

    expect(mocks.verifyOrgContextToken).toHaveBeenCalledWith("tampered-token");
    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: null,
        orgContextToken: null,
        orgContextVerified: false,
      }),
    );
  });

  it("keeps verified org attribution when the org token is valid", async () => {
    mocks.verifyOrgContextToken.mockReturnValue({
      ok: true,
      organizationId: "org_123",
    });

    await EmbedPage({
      searchParams: Promise.resolve({ token: "signed-token" }),
    });

    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_123",
        orgContextToken: "signed-token",
        orgContextVerified: true,
      }),
    );
  });
});
