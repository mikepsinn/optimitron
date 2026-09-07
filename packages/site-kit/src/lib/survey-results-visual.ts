import {
  TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
} from "@optimitron/db/constants"
import type { DashboardSurveyResults } from "./survey-results"

/** Explicit layout previews; production requests always use the database. */
export function getSurveyResultsVisualFixture(visual?: string, personal = false): DashboardSurveyResults | undefined {
  if (process.env.NODE_ENV !== "development" && process.env.SITE_APP_VISUAL_FIXTURES !== "1") return undefined
  if (visual !== "1" && visual !== "empty") return undefined
  const empty = visual === "empty"
  return {
    questions: [
      {
        slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG,
        title: "Patient access",
        question: TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
        percentages: empty ? null : { YES: 75, NO: 15, ABSTAIN: 10 },
      },
      {
        slug: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
        title: "Patient-funded access",
        question: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
        percentages: empty ? null : { YES: 60, NO: 25, ABSTAIN: 15 },
      },
    ],
    funding: { user: personal && !empty ? 35 : null, average: empty ? null : 30, median: empty ? null : 25 },
  }
}
