import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import React from "react";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";

vi.mock("@/components/referendum/ReferendumSignatureBox", () => ({
  ReferendumSignatureBox: () => null,
}));
vi.mock("@/components/landing/TreatyReminderComposer", () => ({
  TreatyReminderComposer: () => null,
}));
vi.mock("@/components/shared/ParameterValue", () => ({
  ParameterValue: () => null,
}));

describe("ReferendumSiteInlineSign", () => {
  it("passes Court membership labels, referral attribution, and share URL behavior", async () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    const { ReferendumSiteInlineSign } = await import(
      "./ReferendumSiteInlineSign"
    );

    const element = (ReferendumSiteInlineSign as unknown as (props: {
      referendumSlug: string;
      referralCode?: string | null;
    }) => ReactElement)({
      referendumSlug: COURT_OF_HUMANITY_SLUG,
      referralCode: "alice",
    });

    expect(element.props.referralCode).toBe("alice");
    expect(element.props.submitLabel).toBe("Join");
    expect(element.props.submittingLabel).toBe("Joining...");
    expect(element.props.authTitle).toBe("Finish Joining");
    expect(element.props.emailButtonLabel).toBe(
      "Email Me a Link to Finish Joining",
    );
    expect(element.props.emailPendingButtonLabel).toBe(
      "Sending Finish-Joining Link...",
    );
    expect(
      element.props.buildShareUrl(
        { handle: "member-1", referralCode: "fallback" },
        "https://example.org",
      ),
    ).toBe("https://example.org/court?ref=member-1");
  }, 20000);
});
