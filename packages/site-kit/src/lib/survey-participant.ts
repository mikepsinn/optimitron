import countries from "world-countries"
import { z } from "zod"
import { normalizeUsRegionCode, US_REGIONS } from "./us-states"

export const SURVEY_COUNTRIES = countries
  .map((country) => ({ code: country.cca2, name: country.name.common }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"))

export const SURVEY_ROLES = [
  ["patient-or-caregiver", "Patient or caregiver"],
  ["clinician", "Clinician"],
  ["researcher", "Researcher"],
  ["public-educator", "Public educator or organizer"],
  ["state-legislator-or-staff", "Legislator or staff"],
  ["other", "Other"],
] as const

const US_REGION_CODES = new Set<string>(US_REGIONS.map(([, code]) => code))

export const surveyParticipantSchema = z.object({
  countryCode: z.string().refine(
    (value) => SURVEY_COUNTRIES.some(({ code }) => code === value),
    "Choose your country.",
  ),
  regionCode: z.string().trim().max(100),
  role: z.enum([
    "patient-or-caregiver", "clinician", "researcher", "public-educator",
    "state-legislator-or-staff", "other",
  ]),
  story: z.string().trim().max(2000),
  updates: z.boolean(),
})
  // Older clients and prefilled links send "Missouri" or "US-MO"; store the
  // bare code so every US answer for one state lands on one regionCode.
  .transform((value) => value.countryCode !== "US" ? value
    : { ...value, regionCode: normalizeUsRegionCode(value.regionCode) ?? value.regionCode })
  .superRefine((value, ctx) => {
    if (value.countryCode === "US" && !US_REGION_CODES.has(value.regionCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["regionCode"], message: "Choose your state." })
    }
  })

export type SurveyParticipant = z.infer<typeof surveyParticipantSchema>

export const SURVEY_UPDATES_LABEL =
  "Send me occasional updates about clinical trials and patient access."
