import { describe, expect, it } from "vitest"

import { MAX_LISTED_TRIALS, tallyStateTrials, type CtgovStudy } from "@/lib/state-trials"

function study(
  nctId: string,
  { conditions, mesh = [], interventions = ["DRUG"], sites }: {
    conditions: string[]
    mesh?: string[]
    interventions?: string[]
    sites: [state: string, status: string][]
  },
): CtgovStudy {
  return {
    protocolSection: {
      identificationModule: { nctId },
      conditionsModule: { conditions },
      armsInterventionsModule: { interventions: interventions.map(type => ({ type })) },
      contactsLocationsModule: {
        locations: sites.map(([state, status]) => ({ state, status, country: "United States" })),
      },
    },
    derivedSection: { conditionBrowseModule: { meshes: mesh.map(term => ({ term })) } },
  }
}

describe("tallyStateTrials", () => {
  it("counts a drug trial once in each state where one of its sites is recruiting", () => {
    const counts = tallyStateTrials([
      study("NCT1", {
        conditions: ["Early Alzheimer's Disease"],
        sites: [["Missouri", "RECRUITING"], ["Missouri", "NOT_YET_RECRUITING"], ["Missouri", "RECRUITING"], ["Illinois", "COMPLETED"], ["Puerto Rico", "RECRUITING"]],
      }),
      study("NCT2", { conditions: ["Alzheimer Disease"], interventions: ["BEHAVIORAL"], sites: [["Missouri", "RECRUITING"]] }),
    ])

    expect(counts.Missouri.alzheimers).toEqual({ count: 1, ids: ["NCT1"] })
    expect(counts.Illinois.alzheimers.count).toBe(0)
  })

  it("matches the conditions a sponsor listed, not ClinicalTrials.gov's loose MeSH mapping", () => {
    const counts = tallyStateTrials([
      // ClinicalTrials.gov maps amyloidosis trials to the Alzheimer Disease MeSH term.
      study("NCT3", { conditions: ["Transthyretin Amyloidosis"], mesh: ["Alzheimer Disease"], sites: [["Missouri", "RECRUITING"]] }),
      // A cancer listed only by abbreviation still counts through the Neoplasms term.
      study("NCT4", { conditions: ["NSCLC"], mesh: ["Neoplasms"], sites: [["Missouri", "RECRUITING"]] }),
    ])

    expect(counts.Missouri.alzheimers.count).toBe(0)
    expect(counts.Missouri.cancer).toEqual({ count: 1, ids: ["NCT4"] })
  })

  it("keeps only the count when a state has more trials than a link can list", () => {
    const studies = Array.from({ length: MAX_LISTED_TRIALS + 1 }, (_, i) =>
      study(`NCT${i}`, { conditions: ["Breast Cancer"], sites: [["Texas", "RECRUITING"]] }))

    expect(tallyStateTrials(studies).Texas.cancer).toEqual({ count: MAX_LISTED_TRIALS + 1 })
  })
})
