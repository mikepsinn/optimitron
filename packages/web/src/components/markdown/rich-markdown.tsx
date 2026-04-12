"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { MermaidBlock } from "./mermaid-block";
import { ChartBlock, parseChartConfig } from "./chart-block";

interface RichMarkdownProps {
  markdown: string;
  className?: string;
}

/**
 * The single markdown renderer used across the app for task descriptions,
 * comments, and anywhere else markdown shows up.
 *
 * Supports:
 *  - GitHub-flavored markdown (tables, strikethrough, task lists, autolinks)
 *  - Inline and block LaTeX math via remark-math + rehype-katex
 *  - ```mermaid fenced code blocks — lazy-loaded Mermaid renderer
 *  - ```chart fenced code blocks with Chart.js JSON — lazy-loaded chart renderer
 *  - Standard language code fences rendered as syntax-highlighted <code>
 *
 * Heavy libraries (Mermaid, Chart.js) are only loaded from CDN when a
 * comment actually contains one of those fence types. Zero bundle cost
 * for text-only content.
 */
export function RichMarkdown({ markdown, className }: RichMarkdownProps) {
  return (
    <div className={`task-markdown space-y-3 text-sm font-bold leading-7 text-muted-foreground ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          // Disable single-`$` inline math so currency like "$27.2B" isn't
          // misparsed as a math delimiter. Block math with `$$...$$` still works.
          [remarkMath, { singleDollarTextMath: false }],
        ]}
        rehypePlugins={[rehypeKatex]}
        components={getRichMarkdownComponents()}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function getRichMarkdownComponents(): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-foreground">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-6 text-xl font-black uppercase tracking-tight text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 text-base font-black uppercase tracking-tight text-foreground">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-sm font-bold leading-7 text-muted-foreground">{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-black text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="list-disc space-y-1 pl-6 text-sm font-bold text-muted-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-6 text-sm font-bold text-muted-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-black text-brutal-pink underline underline-offset-4 hover:text-foreground"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-brutal-pink bg-muted px-4 py-3 text-base font-bold text-foreground">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table className="my-3 w-full border-collapse border-2 border-foreground text-xs font-bold">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/30">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border border-foreground/30 px-2 py-1 text-left font-black uppercase">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-foreground/30 px-2 py-1">{children}</td>
    ),
    img: ({ src, alt }) => {
      if (!src) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={typeof src === "string" ? src : undefined}
          alt={alt ?? ""}
          className="my-3 max-h-96 max-w-full border-2 border-foreground"
        />
      );
    },
    // Extended fence handling: mermaid + chart + inline/code
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className ?? "");
      const language = match?.[1];
      const raw = String(children ?? "").replace(/\n$/, "");

      if (language === "mermaid") {
        return <MermaidBlock code={raw} />;
      }

      if (language === "chart") {
        const config = parseChartConfig(raw);
        if (config) {
          return <ChartBlock config={config} />;
        }
        // Fall through to code block if JSON was invalid
      }

      // Inline code vs. block code
      const isInline = !className;
      if (isInline) {
        return (
          <code className="border-2 border-primary bg-muted px-1 py-0.5 text-xs">
            {children}
          </code>
        );
      }

      return (
        <pre className="my-3 overflow-x-auto border-2 border-primary bg-muted p-3 text-xs">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };
}
