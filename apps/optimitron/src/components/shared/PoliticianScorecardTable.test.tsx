import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PoliticianScorecardTable } from "./PoliticianScorecardTable";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const scorecards = [
  {
    bioguideId: "T000001",
    chamber: "Senate",
    clinicalTrialDollarsVotedFor: 1,
    militaryDollarsVotedFor: 10,
    name: "Test Politician",
    party: "I",
    ratio: 10,
    state: "TS",
  },
];

function renderTable(hideControls = false) {
  return renderToStaticMarkup(
    <PoliticianScorecardTable
      hideControls={hideControls}
      limit={1}
      rankModeLabels={{
        leastBad: "Least Bad Politicians",
        worst: "Worst Politicians",
      }}
      scorecards={scorecards}
      systemWideRatio={10}
    />,
  );
}

describe("PoliticianScorecardTable", () => {
  it("keeps scoreboard controls when the row count is limited", () => {
    const html = renderTable();

    expect(html).toContain("Worst Politicians");
    expect(html).toContain("Least Bad Politicians");
    expect(html).toContain('placeholder="Search name or state..."');
  });

  it("hides controls only when the embedding surface requests it", () => {
    const html = renderTable(true);

    expect(html).not.toContain("Worst Politicians");
    expect(html).not.toContain("Least Bad Politicians");
    expect(html).not.toContain('placeholder="Search name or state..."');
  });
});
