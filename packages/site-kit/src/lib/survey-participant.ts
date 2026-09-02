import countries from "world-countries"
import { z } from "zod"

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
}).refine((value) => value.countryCode !== "US" || Boolean(value.regionCode), {
  message: "Enter your state.",
  path: ["regionCode"],
})

export type SurveyParticipant = z.infer<typeof surveyParticipantSchema>

export const SURVEY_UPDATES_LABEL =
  "Send me occasional updates about clinical trials and patient access."
