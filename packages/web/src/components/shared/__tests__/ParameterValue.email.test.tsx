import React from "react";
import { describe, expect, it } from "vitest";
import { SHARING_TIME_MINUTES } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { renderReactEmailHtml } from "@/lib/email/render-react-email";

describe("ParameterValue email rendering", () => {
  it("uses the adaptive parameter API but renders an email-safe manual link", async () => {
    const html = await renderReactEmailHtml(
      <p>
        Please take{" "}
        <ParameterValue
          param={SHARING_TIME_MINUTES}
          valueOverride="30 seconds"
        />{" "}
        to vote.
      </p>,
    );

    expect(html).toContain(`href="${SHARING_TIME_MINUTES.manualPageUrl}"`);
    expect(html).toContain(">30 seconds</a>");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("data-radix");
  });
});
