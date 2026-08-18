import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SHARING_TIME_MINUTES } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

describe("ParameterValue page copy previews", () => {
  it("exposes parameter source URLs for markdown snapshot links", () => {
    const html = renderToStaticMarkup(
      <p>
        Please take{" "}
        <ParameterValue
          param={SHARING_TIME_MINUTES}
          valueOverride="30 seconds"
        />{" "}
        to vote.
      </p>,
    );

    expect(html).toContain(
      `data-copy-preview-href="${SHARING_TIME_MINUTES.manualPageUrl}"`,
    );
    expect(html).toContain(">30 seconds</button>");
  });

  it("keeps source URLs on inline values too", () => {
    const html = renderToStaticMarkup(
      <ParameterValue
        param={SHARING_TIME_MINUTES}
        presentation="inline"
        valueOverride="30 seconds"
      />,
    );

    expect(html).toContain("<span");
    expect(html).toContain(
      `data-copy-preview-href="${SHARING_TIME_MINUTES.manualPageUrl}"`,
    );
    expect(html).toContain(">30 seconds</span>");
  });
});
