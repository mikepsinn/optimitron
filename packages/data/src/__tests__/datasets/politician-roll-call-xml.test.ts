import { describe, expect, it } from "vitest";

import { parseSenateXml } from "../../datasets/politician-roll-call-xml";

function senateMemberXml(firstName: string, lastName: string, state: string, vote: string): string {
  return `<member>
    <member_full>${lastName} (R-${state})</member_full>
    <last_name>${lastName}</last_name>
    <first_name>${firstName}</first_name>
    <party>R</party>
    <state>${state}</state>
    <vote_cast>${vote}</vote_cast>
    <lis_member_id>S000</lis_member_id>
  </member>`;
}

describe("parseSenateXml", () => {
  // Darline Graham replaced Lindsey Graham as a senator from South Carolina.
  // The parser matched on last name and state first, so every vote Lindsey
  // Graham cast was credited to Darline Graham, and he lost his scorecard.
  it("credits the named senator when another senator from the state has the same last name", () => {
    const senators = [
      { bioguideId: "G000359", name: "Graham, Lindsey", state: "South Carolina" },
      { bioguideId: "G000608", name: "Graham, Darline", state: "South Carolina" },
    ];
    const xml = `<members>${senateMemberXml("Lindsey", "Graham", "SC", "Yea")}</members>`;

    expect(parseSenateXml(xml, senators)).toEqual(new Map([["G000359", "YEA"]]));
  });

  // The Senate XML says "Timothy Kaine"; Congress.gov lists "Kaine, Tim".
  it("matches on last name and state when the roll call uses another first name", () => {
    const senators = [{ bioguideId: "K000384", name: "Kaine, Tim", state: "Virginia" }];
    const xml = `<members>${senateMemberXml("Timothy", "Kaine", "VA", "Nay")}</members>`;

    expect(parseSenateXml(xml, senators)).toEqual(new Map([["K000384", "NAY"]]));
  });
});
