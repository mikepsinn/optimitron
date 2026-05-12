import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getApprovedOrganizationForSurveySlug: vi.fn(),
  prepareReasoningSession: vi.fn(),
  resolveLocale: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/components/reasoning/ReasoningFlow", () => ({
  ReasoningFlow: () => null,
}));

vi.mock("@/lib/organization.server", () => ({
  getApprovedOrganizationForSurveySlug: mocks.getApprovedOrganizationForSurveySlug,
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
    mocks.getApprovedOrganizationForSurveySlug.mockResolvedValue(null);
    mocks.prepareReasoningSession.mockResolvedValue({
      arms: [],
      session: { id: "session-1" },
      signatureCount: 0,
    });
  });

  it("prepares a neutral public embed when no organization slug is present", async () => {
    await EmbedPage({ searchParams: Promise.resolve({}) });

    expect(mocks.getApprovedOrganizationForSurveySlug).not.toHaveBeenCalled();
    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: null,
        organizationResolved: false,
        surface: "embed",
      }),
    );
  });

  it("falls back to neutral public context when the organization slug is unknown", async () => {
    mocks.getApprovedOrganizationForSurveySlug.mockResolvedValue(null);

    await EmbedPage({
      searchParams: Promise.resolve({ org: "unknown-org" }),
    });

    expect(mocks.getApprovedOrganizationForSurveySlug).toHaveBeenCalledWith(
      "unknown-org",
    );
    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: null,
        organizationResolved: false,
      }),
    );
  });

  it("keeps organization attribution when the public organization slug resolves", async () => {
    mocks.getApprovedOrganizationForSurveySlug.mockResolvedValue({
      id: "org_123",
      slug: "institute-for-accelerated-medicine",
    });

    await EmbedPage({
      searchParams: Promise.resolve({
        org: "institute-for-accelerated-medicine",
      }),
    });

    expect(mocks.prepareReasoningSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_123",
        organizationResolved: true,
      }),
    );
  });
});
