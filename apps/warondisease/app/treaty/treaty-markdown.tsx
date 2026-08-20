import type { ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type MarkdownComponents = ComponentProps<typeof ReactMarkdown>["components"]

/**
 * Neobrutalist element styling for the treaty document body. The document is
 * long-form legal-ish text, so headings stay loud and the body stays readable.
 */
const treatyMarkdownComponents: MarkdownComponents = {
  h1: ({ children }) => (
    <h2 className="mt-10 text-2xl font-black uppercase sm:text-3xl">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 text-2xl font-black uppercase sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-xl font-black uppercase sm:text-2xl">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 text-lg font-black sm:text-xl">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base font-medium leading-relaxed sm:text-lg">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base font-medium sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base font-medium sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-4 border-primary bg-brutal-yellow/40 px-4 py-2 font-medium">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-bold underline decoration-2 underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    // Focusable region so keyboard-only users can scroll wide tables.
    <div
      className="mt-6 overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label="Treaty table"
    >
      <table className="w-full border-4 border-primary text-left text-sm sm:text-base">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-2 border-primary bg-brutal-yellow px-3 py-2 font-black uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-2 border-primary px-3 py-2 font-medium">
      {children}
    </td>
  ),
  hr: () => <hr className="mt-8 border-t-4 border-primary" />,
}

export function TreatyMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={treatyMarkdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  )
}
