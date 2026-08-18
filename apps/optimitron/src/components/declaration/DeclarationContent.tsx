import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { shareableSnippets } from "@optimitron/data/parameters";

export const WHY_OPTIMIZATION_PARAGRAPHS = shareableSnippets
  .whyOptimizationIsNecessary.markdown
  .split(/\n\n+/)
  .map((paragraph) => paragraph.trim())
  .filter(Boolean);

export function DeclarationBody() {
  return (
    <div className="space-y-8 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="border-t-4 border-primary pt-6 text-2xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-center text-xl font-black uppercase tracking-tight text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-2xl">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-6 text-lg leading-8 text-foreground [font-family:var(--v0-font-libre-baskerville)] [overflow-wrap:break-word]">
              {children}
            </p>
          ),
          a: ({ href, children }) => {
            const target = href ?? "#";
            const isExternal = target.startsWith("http");
            if (isExternal) {
              return (
                <a
                  href={target}
                  target="_blank"
                  rel="noreferrer"
                  className="font-black text-muted-foreground"
                >
                  {children}
                </a>
              );
            }
            return (
              <Link href={target} className="font-black text-muted-foreground">
                {children}
              </Link>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-foreground bg-muted px-4 py-3 text-sm font-bold text-foreground">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6 text-base font-bold text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6 text-base font-bold text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          hr: () => <hr className="border-t-4 border-primary" />,
        }}
      >
        {shareableSnippets.declarationOfOptimization.markdown}
      </ReactMarkdown>
    </div>
  );
}

export function DeclarationWhyPageSection() {
  return (
    <div className="mx-auto box-border w-full max-w-xl px-6 py-16 [overflow-wrap:break-word] sm:px-8">
      <div className="space-y-24">
        {WHY_OPTIMIZATION_PARAGRAPHS.map((paragraph, index) => (
          <ReactMarkdown
            key={`${index}-${paragraph.slice(0, 24)}`}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-center text-2xl leading-relaxed text-foreground [font-family:var(--v0-font-libre-baskerville)] [overflow-wrap:break-word] sm:text-3xl">
                  {children}
                </p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-black text-foreground"
                >
                  {children}
                </a>
              ),
            }}
          >
            {paragraph}
          </ReactMarkdown>
        ))}
      </div>
    </div>
  );
}
