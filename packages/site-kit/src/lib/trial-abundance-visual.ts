export type TrialAbundanceVisualState =
  | "question"
  | "self-funded"
  | "allocation"
  | "complete"
  | "saved"
  | "save-error"

export function parseTrialAbundanceVisualState(value?: string): TrialAbundanceVisualState | undefined {
  if (value === "saved") {
    return process.env.NODE_ENV === "development" || process.env.SITE_APP_VISUAL_FIXTURES === "1"
      ? "saved" : undefined
  }
  return value === "question" || value === "self-funded" || value === "allocation" ||
    value === "complete" || value === "save-error" ? value : undefined
}
