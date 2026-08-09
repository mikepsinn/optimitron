export function getSentrySampleRate(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback
}
