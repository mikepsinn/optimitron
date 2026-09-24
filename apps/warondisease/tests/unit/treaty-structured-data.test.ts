import { describe, expect, it } from "vitest"
import {
  buildSiteStructuredData,
  buildTreatyStructuredData,
  buildVoteStructuredData,
} from "../../lib/structured-data"

describe("treaty and vote structured data", () => {
  const website = buildSiteStructuredData()["@graph"].find((node) => node["@type"] === "WebSite")

  it.each([
    ["/treaty", buildTreatyStructuredData],
    ["/vote", buildVoteStructuredData],
  ])("publishes %s on warondisease.org with the treaty and its vote action", (path, build) => {
    const graph = build()["@graph"]
    const [page, legislation, voteAction] = graph

    expect(graph.map((node) => node["@type"])).toEqual(["WebPage", "Legislation", "VoteAction"])
    expect(website?.["@id"]).toEqual(expect.any(String))
    expect(page).toMatchObject({
      url: `https://warondisease.org${path}`,
      isPartOf: { "@id": website?.["@id"] },
    })
    expect(legislation).toMatchObject({ url: "https://warondisease.org/treaty" })
    expect(voteAction).toMatchObject({
      target: "https://warondisease.org/vote",
      object: { "@id": legislation["@id"] },
    })
  })
})
