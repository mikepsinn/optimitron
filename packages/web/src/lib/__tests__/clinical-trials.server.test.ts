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

describe("clinical trials fetch helpers", () => {
  it("builds ClinicalTrials.gov URLs from condition and intervention filters", () => {
    const url = buildClinicalTrialsGovUrl({
      condition: "Asthma",
      intervention: "Metformin",
      studyStatus: "recruiting",
      limit: 25,
    });

    expect(url.origin).toBe("https://clinicaltrials.gov");
    expect(url.pathname).toBe("/api/int/studies");
    expect(url.searchParams.get("cond")).toBe("Asthma");
    expect(url.searchParams.get("intr")).toBe("Metformin");
    expect(url.searchParams.get("limit")).toBe("25");
    expect(url.searchParams.get("aggFilters")).toContain("status:rec");
  });

  it("fetches and parses ClinicalTrials.gov responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: 0,
        limit: 1,
        total: 1,
        terms: ["asthma"],
        hits: [
          {
            id: "NCT00000001",
            study: {
              NCTId: ["NCT00000001"],
              BriefTitle: ["A very tiny trial fixture"],
              OverallStatus: ["RECRUITING"],
              Condition: ["Asthma"],
              InterventionName: ["Albuterol"],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const result = await fetchClinicalTrials({
      condition: "Asthma",
      intervention: "Albuterol",
      limit: 1,
    });

    expect(result.total).toBe(1);
    expect(result.hits[0]?.id).toBe("NCT00000001");
    expect(result.hits[0]?.study.BriefTitle).toEqual([
      "A very tiny trial fixture",
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: { Accept: "application/json" },
        method: "GET",
        signal: expect.any(AbortSignal),
      }),
    );
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
