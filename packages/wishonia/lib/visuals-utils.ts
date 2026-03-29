import type { VisualsResult } from "./visuals-prompt";

export function trimVisualsContext(context: string, maxChars = 8000): string {
  const normalized = context.trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}\n\n[Context truncated for visuals]`;
}

export function hasVisualContent(data: Partial<VisualsResult> | null | undefined): boolean {
  if (!data) return false;
  return Boolean(
    data.keyFigure ||
    data.latex ||
    data.chartConfig ||
    data.table ||
    data.mermaid ||
    data.image ||
    (data.sourceLinks && data.sourceLinks.length > 0)
  );
}
