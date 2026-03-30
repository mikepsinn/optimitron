export function formatPoliticianOgDescriptor(
  parts: Array<string | null | undefined>,
): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

export function formatPoliticianOgRatio(ratio: number): string {
  return ratio >= 999_999 ? "999,999+:1" : `${ratio.toLocaleString()}:1`;
}
