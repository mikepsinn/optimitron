import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import React from "react";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

vi.mock("@/components/referendum/ReferendumStepper", () => ({
  ReferendumStepper: () => null,
  splitIntoSlides: (markdown: string) => markdown.split(/\n\n+/).filter(Boolean),
}));
vi.mock("@/components/landing/TreatyVoteFlow", () => ({
  TreatyVoteFlow: () => null,
}));
vi.mock("@/components/site/ReferendumSiteInlineSign", () => ({
  ReferendumSiteInlineSign: () => null,
}));

describe("ReferendumStepperPage", () => {
  async function renderPage(slug: string, referralCode?: string | null) {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    const { ReferendumStepperPage } = await import("./ReferendumStepperPage");
    return (ReferendumStepperPage as unknown as (props: {
      slug: string;
      referralCode?: string | null;
    }) => ReactElement)({ slug, referralCode });
  }

  it("uses the generic signature surface for non-treaty referendums", async () => {
    const element = await renderPage(DECLARATION_SLUG, "alice");
    const signatureSlot = element.props.signatureSlot as (
      mode: "stepper" | "reader",
    ) => ReactElement;

    const signature = signatureSlot("reader");

    expect(signature.props.referendumSlug).toBe(DECLARATION_SLUG);
    expect(signature.props.referralCode).toBe("alice");
  }, 20000);

  it("keeps the treaty on the treaty vote flow", async () => {
    const element = await renderPage(TREATY_REFERENDUM_SLUG);
    const signatureSlot = element.props.signatureSlot as (
      mode: "stepper" | "reader",
    ) => ReactElement;

    const signature = signatureSlot("reader");

    expect(signature.props.referendumSlug).toBeUndefined();
    expect(signature.props.authCallbackUrl).toBe("/treaty");
  }, 20000);
});
