"use client"

import { useMemo } from "react"

const DEFAULT_SURVEY_ORIGIN =
  process.env.NEXT_PUBLIC_SURVEY_ORIGIN ?? "https://trialabundancesurvey.org"

export type SurveyEmbedProps = {
  /** Referral / org attribution code */
  referralCode?: string | null
  /** Survey host origin (no trailing slash) */
  origin?: string
  /** iframe title for a11y */
  title?: string
  /** CSS height (default tall enough for vote UI) */
  height?: string | number
  className?: string
}

/**
 * First-party React wrapper around the canonical survey embed iframe.
 * Host apps (acceleratedmedicine, curedao, warondisease) should use this
 * instead of duplicating vote UI.
 */
export function SurveyEmbed({
  referralCode,
  origin = DEFAULT_SURVEY_ORIGIN,
  title = "Trial Abundance Survey",
  height = 720,
  className,
}: SurveyEmbedProps) {
  const src = useMemo(() => {
    const url = new URL("/embed", origin)
    if (referralCode) url.searchParams.set("ref", referralCode)
    url.searchParams.set("embed", "1")
    return url.toString()
  }, [origin, referralCode])

  const heightCss = typeof height === "number" ? `${height}px` : height

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      style={{
        width: "100%",
        height: heightCss,
        border: "4px solid #000",
        background: "#fff",
      }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allow="clipboard-write"
    />
  )
}
