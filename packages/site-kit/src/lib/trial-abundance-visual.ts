export type TrialAbundanceVisualState =
  | "question"
  | "self-funded"
  | "allocation"
  | "details"
  | "complete"
  | "save-error"

export function parseTrialAbundanceVisualState(value?: string): TrialAbundanceVisualState | undefined {
  return value === "question" || value === "self-funded" || value === "allocation" ||
    value === "details" || value === "complete" || value === "save-error" ? value : undefined
}
