"use client"

import { SURVEY_COUNTRIES, SURVEY_ROLES, SURVEY_UPDATES_LABEL } from "../../lib/survey-participant"
import type { SurveyParticipant } from "../../lib/survey-participant"

export type ParticipantDraft = Omit<SurveyParticipant, "role"> & { role: string }

const inputClass = "mt-2 w-full border-4 border-primary bg-background p-3 font-bold"

export function SurveyParticipantFields({ value, onChange }: {
  value: ParticipantDraft
  onChange: (value: ParticipantDraft) => void
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-black">
          Country
          <select className={inputClass} autoComplete="country" required value={value.countryCode}
            onChange={(event) => onChange({ ...value, countryCode: event.target.value, regionCode: "" })}>
            <option value="">Choose a country</option>
            {SURVEY_COUNTRIES.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        {value.countryCode ? (
          <label className="font-black">
            {value.countryCode === "US" ? "State" : "State / region (optional)"}
            <input className={inputClass} autoComplete="address-level1" maxLength={100}
              required={value.countryCode === "US"} value={value.regionCode}
              onChange={(event) => onChange({ ...value, regionCode: event.target.value })} />
          </label>
        ) : null}
      </div>
      <label className="font-black">
        Your role
        <select className={inputClass} required value={value.role}
          onChange={(event) => onChange({ ...value, role: event.target.value })}>
          <option value="">Choose a role</option>
          {SURVEY_ROLES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="font-black">
        Why does this matter to you? <span className="font-normal">(optional)</span>
        <textarea className={`${inputClass} min-h-28`} maxLength={2000} value={value.story}
          onChange={(event) => onChange({ ...value, story: event.target.value })} />
      </label>
      <label className="flex items-start gap-3 font-bold">
        <input className="mt-1 h-5 w-5 shrink-0 accent-black" type="checkbox" checked={value.updates}
          onChange={(event) => onChange({ ...value, updates: event.target.checked })} />
        {SURVEY_UPDATES_LABEL}
      </label>
    </>
  )
}
