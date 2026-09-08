import { afterEach, describe, expect, it, vi } from "vitest"
import { getSurveyResultsVisualFixture } from "@optimitron/site-kit/lib/survey-results-visual"

afterEach(() => vi.unstubAllEnvs())

describe("survey results previews", () => {
  it("cannot replace production results through a query parameter", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SITE_APP_VISUAL_FIXTURES", "")
    expect(getSurveyResultsVisualFixture("1")).toBeUndefined()
    expect(getSurveyResultsVisualFixture("empty")).toBeUndefined()
  })

  it("keeps ordinary development requests on real data", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(getSurveyResultsVisualFixture()).toBeUndefined()
    expect(getSurveyResultsVisualFixture("invalid")).toBeUndefined()
  })

  it("omits personal responses from public previews", () => {
    vi.stubEnv("SITE_APP_VISUAL_FIXTURES", "1")
    expect(getSurveyResultsVisualFixture("1")?.funding.user).toBeNull()
    expect(getSurveyResultsVisualFixture("1", true)?.funding.user).toBe(35)
    expect(getSurveyResultsVisualFixture("empty", true)?.funding).toEqual({ user: null, average: null, median: null })
  })
})
