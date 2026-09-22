import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildClinicalTrialsGovUrl,
  fetchClinicalTrials,
} from "@/lib/medical/clinical-trials.server";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** One study in the shape the public v2 API returns. */
function v2Study(nctId: string, briefTitle: string) {
  return {
    protocolSection: {
      identificationModule: { nctId, briefTitle },
      statusModule: { overallStatus: "RECRUITING" },
      conditionsModule: { conditions: ["Asthma"] },
    },
    hasResults: false,
  };
}

describe("clinical trials fetch helpers", () => {
  it("builds ClinicalTrials.gov URLs from condition and intervention filters", () => {
    const url = buildClinicalTrialsGovUrl({
      condition: "Asthma",
      intervention: "Metformin",
      studyStatus: "recruiting",
      limit: 25,
    });

    expect(url.origin).toBe("https://clinicaltrials.gov");
    // The site's internal /api/int/studies endpoint answers 403 to everyone.
    expect(url.pathname).toBe("/api/v2/studies");
    expect(url.searchParams.get("query.cond")).toBe("Asthma");
    expect(url.searchParams.get("query.intr")).toBe("Metformin");
    expect(url.searchParams.get("filter.overallStatus")).toBe("RECRUITING");
    expect(url.searchParams.get("pageSize")).toBe("25");
  });

  it("asks for enough studies to reach the requested offset", () => {
    const url = buildClinicalTrialsGovUrl({ condition: "Asthma", from: 40, limit: 10 });

    // v2 pages by token, so the offset window is read from the first 50.
    expect(url.searchParams.get("pageSize")).toBe("50");
  });

  it("combines study type, sex, and age filters into one advanced expression", () => {
    const url = buildClinicalTrialsGovUrl({
      condition: "Asthma",
      studyType: "int",
      sex: "female",
      ageGroups: ["child", "adult"],
    });

    expect(url.searchParams.get("filter.advanced")).toBe(
      "AREA[StudyType]INTERVENTIONAL AND AREA[Sex]FEMALE AND AREA[StdAge](CHILD OR ADULT)",
    );
  });

  it("maps v2 studies onto the offset-paged shape the pages render", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalCount: 42,
        studies: [
          v2Study("NCT00000001", "First page fixture"),
          v2Study("NCT00000002", "Second page fixture"),
        ],
      }),
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const result = await fetchClinicalTrials({
      condition: "Asthma",
      from: 1,
      limit: 1,
    });

    expect(result.total).toBe(42);
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]?.id).toBe("NCT00000002");
    expect(
      result.hits[0]?.study.protocolSection?.identificationModule?.briefTitle,
    ).toBe("Second page fixture");
  });

  it("throws when ClinicalTrials.gov returns a non-OK response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "temporarily unavailable",
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    await expect(fetchClinicalTrials({ condition: "Asthma" })).rejects.toThrow(
      "ClinicalTrials.gov returned 503",
    );
  });
});
