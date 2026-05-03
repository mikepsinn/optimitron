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
  async function renderPage(props: {
    slug: string;
    referralCode?: string | null;
    question?: string | null;
    bodyMarkdown?: string | null;
  }) {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    const { ReferendumStepperPage } = await import("./ReferendumStepperPage");
    return (ReferendumStepperPage as unknown as (props: {
      slug: string;
      referralCode?: string | null;
      question?: string | null;
      bodyMarkdown?: string | null;
    }) => ReactElement)(props);
  }

  it("uses the generic signature surface for non-treaty referendums", async () => {
    const element = await renderPage({
      slug: DECLARATION_SLUG,
      referralCode: "alice",
    });
    const signatureSlot = element.props.signatureSlot as (
      mode: "stepper" | "reader",
    ) => ReactElement;

    const signature = signatureSlot("reader");

    expect(signature.props.referendumSlug).toBe(DECLARATION_SLUG);
    expect(signature.props.referralCode).toBe("alice");
  }, 20000);

  it("keeps the treaty on the treaty vote flow", async () => {
    const element = await renderPage({ slug: TREATY_REFERENDUM_SLUG });
    const signatureSlot = element.props.signatureSlot as (
      mode: "stepper" | "reader",
    ) => ReactElement;

    const signature = signatureSlot("reader");

    expect(signature.props.referendumSlug).toBeUndefined();
    expect(signature.props.authCallbackUrl).toBe("/treaty");
  }, 20000);

  it("prefers database question and markdown body when supplied", async () => {
    const element = await renderPage({
      slug: DECLARATION_SLUG,
      question: "Do you endorse the tiny test referendum?",
      bodyMarkdown: "First detail.\n\nSecond detail.",
    });

    expect(element.props.introText).toBe("Do you endorse the tiny test referendum?");
    expect(element.props.slides).toEqual(["First detail.", "Second detail."]);
  }, 20000);
});
