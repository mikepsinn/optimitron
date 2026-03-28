/**
 * Visual Supplements - System prompt and schema
 * Ported from transmit/lib/visuals-prompt.ts.
 */

import { z } from "zod";

export const VISUALS_SYSTEM_PROMPT = `You are a visual supplement generator for an educational chat about "How to End War and Disease" -- a plan to redirect 1% of military spending to clinical trials.

Your job: given a user question and reference material, produce ONLY the visual elements that genuinely help illustrate the answer. Leave everything else null. Do not force visuals where plain text suffices.

Rules:
- keyFigure: Use when there is ONE standout number that anchors the answer (e.g., "$27.2 billion/year", "150,000 deaths/day", "604x ratio"). The value should be the number with units, the label a short phrase, context an optional sentence.
- latex: Use ONLY for actual mathematical formulas, equations, or models (e.g., ROI calculations, cost-effectiveness ratios). Never for plain numbers. Use LaTeX notation without $$ delimiters.
- chartConfig: Use when comparing 2+ quantities makes the point clearer than words. Pick the right chart type. Use readable labels. Bar for comparisons, pie for proportions, line for trends, doughnut for shares. Keep datasets to 1-2. Use specific hex colors from this palette: ["#2a6b4f", "#d9534f", "#f0ad4e", "#5bc0de", "#6f42c1", "#20c997"].
- table: Use for structured multi-row comparisons (e.g., cost breakdowns, mechanism comparisons). Keep it compact: 2-5 rows, 2-4 columns.
- mermaid: Use for process flows, decision trees, or system architecture diagrams. Use flowchart TD or LR syntax. Keep it under 15 nodes.
- sourceLinks: Extract from the reference material. Only include 1-3 links that are directly relevant. Use the Source: lines from the context. URLs should be relative paths starting with /.
- image: Pick the best image path from the provided candidates. Only use if the image genuinely illustrates the answer. Return the exact path string.

CRITICAL: Most questions need at most 1-2 visual elements. Many need zero. A keyFigure alone is often enough. Never generate all fields at once.

{context}`;

export const visualsSchema = z.object({
  keyFigure: z
    .object({
      value: z.string().describe("The standout number with units"),
      label: z.string().describe("Short label (2-5 words)"),
      context: z.string().nullable().describe("Optional one-sentence context"),
    })
    .nullable()
    .describe("A single standout statistic that anchors the answer"),

  latex: z
    .string()
    .nullable()
    .describe("LaTeX formula without $$ delimiters, only for real math"),

  chartConfig: z
    .object({
      type: z.enum(["bar", "pie", "line", "doughnut"]),
      data: z.object({
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string(),
            data: z.array(z.number()),
            backgroundColor: z.array(z.string()).optional(),
          })
        ),
      }),
      options: z.record(z.unknown()).optional(),
    })
    .nullable()
    .describe("Chart.js config for visual comparison"),

  table: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string())),
    })
    .nullable()
    .describe("Structured tabular comparison"),

  mermaid: z
    .string()
    .nullable()
    .describe("Mermaid diagram source code"),

  sourceLinks: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      })
    )
    .nullable()
    .describe("1-3 relevant source links from the reference material"),

  image: z
    .string()
    .nullable()
    .describe("Image path from the provided candidates"),
});

export type VisualsResult = z.infer<typeof visualsSchema>;
