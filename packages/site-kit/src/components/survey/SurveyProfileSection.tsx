"use client"

import { useRef, useState } from "react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { AlertCard } from "@optimitron/neobrutalist-ui/ui/alert-card"
import { SurveyParticipantFields } from "../landing/survey-participant-fields"
import type { ParticipantDraft } from "../landing/survey-participant-fields"
import { surveyProfileSchema } from "../../lib/survey-participant"
import type { SurveyProfile } from "../../lib/survey-participant"
import { storage } from "../../lib/storage"

export const EMPTY_SURVEY_PROFILE: SurveyProfile = {
  countryCode: "", regionCode: "", role: "", story: "", updates: false,
}

export function SurveyProfileSection({ visualPreview = false, defaultOpen = false }: {
  visualPreview?: boolean
  defaultOpen?: boolean
}) {
  const [profile, setProfile] = useState<ParticipantDraft>(EMPTY_SURVEY_PROFILE)
  const [loaded, setLoaded] = useState(visualPreview)
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved">("idle")
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  async function loadProfile() {
    if (inFlight.current) return
    inFlight.current = true
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch("/api/survey/profile", { cache: "no-store" })
      if (!response.ok) throw new Error("Profile unavailable")
      const saved = await response.json()
      const hints = !saved.hasProfile ? storage.getSurveyProfileHints() : null
      const parsed = surveyProfileSchema.parse({ ...EMPTY_SURVEY_PROFILE, ...saved,
        countryCode: saved.countryCode || hints?.countryCode || "",
        regionCode: saved.countryCode ? saved.regionCode : hints?.regionCode || "",
        role: saved.role || hints?.role || "",
      })
      setProfile(parsed)
      setLoaded(true)
    } catch {
      setError("We could not load your details. Please try again.")
    } finally {
      inFlight.current = false
      setStatus("idle")
    }
  }

  async function saveProfile() {
    if (visualPreview || inFlight.current || !loaded) return
    const parsed = surveyProfileSchema.safeParse(profile)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.")
      return
    }
    inFlight.current = true
    setStatus("saving")
    setError(null)
    try {
      const response = await fetch("/api/survey/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      })
      if (!response.ok) throw new Error("Profile save failed")
      setProfile(surveyProfileSchema.parse(await response.json()))
      storage.removeSurveyProfileHints()
      setStatus("saved")
    } catch {
      setError("We could not save your details. Please try again.")
      setStatus("idle")
    } finally {
      inFlight.current = false
    }
  }

  return (
    <details id="survey-profile" open={defaultOpen || undefined}
      className="border-4 border-primary bg-background p-6 mb-6"
      onToggle={(event) => { if (event.currentTarget.open && !loaded) void loadProfile() }}>
      <summary className="cursor-pointer text-xl font-black">About you (optional)</summary>
      <div className="mt-6">
        {error ? <AlertCard type="error" message={error} className="mb-4" /> : null}
        {!loaded ? (
          status === "loading" ? <p role="status">Loading your details…</p>
            : <Button onClick={() => void loadProfile()}>Retry</Button>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); void saveProfile() }}>
            <fieldset disabled={visualPreview || status === "saving"} className="flex min-w-0 flex-col gap-5">
              <SurveyParticipantFields optional value={profile} onChange={(value) => {
                setProfile(value); setStatus("idle"); setError(null)
              }} />
              <Button type="submit" className="self-start">{status === "saving" ? "Saving…" : "Save details"}</Button>
            </fieldset>
            {status === "saved" ? <p role="status" className="mt-4 font-bold">Details saved.</p> : null}
          </form>
        )}
      </div>
    </details>
  )
}
