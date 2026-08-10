import { RichMarkdown } from "@/components/markdown/rich-markdown";
import { normalizeTaskTextLineBreaks } from "@/lib/task-text";
import type { TaskReferenceLink } from "@/lib/tasks/task-reference-links";

/**
 * Render a task description as markdown with the neobrutalist typography system.
 *
 * Backwards-compat shim — delegates to the unified `RichMarkdown` renderer that
 * also handles inline math, mermaid diagrams, chart fences, and everything else
 * across the app. This keeps existing call sites working without changes.
 */
export function TaskDescription({
  markdown,
  taskReferences = [],
}: {
  markdown: string;
  taskReferences?: readonly TaskReferenceLink[];
}) {
  return (
    <RichMarkdown
      markdown={normalizeTaskTextLineBreaks(markdown)}
      className="task-description"
      taskReferences={taskReferences}
    />
  );
}

/**
 * Extract a short summary from a markdown description for use in rows, cards,
 * OG images, and share text. Strips markdown syntax and returns the first
 * paragraph, truncated to maxLength chars.
 */
export function getTaskDescriptionSummary(
  markdown: string,
  maxLength = 220,
): string {
  const normalizedMarkdown = normalizeTaskTextLineBreaks(markdown);
  const firstParagraph =
    normalizedMarkdown
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block.length > 0 && !block.startsWith("#")) ??
    normalizedMarkdown;

  const plain = firstParagraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** → bold
    .replace(/\*([^*]+)\*/g, "$1") // *italic* → italic
    .replace(/`([^`]+)`/g, "$1") // `code` → code
    .replace(/^[-*]\s+/gm, "") // bullets
    .replace(/\n/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trimEnd()}...`;
}
