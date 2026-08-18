import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ROUTES } from "@/lib/routes";

function normalizeHref(href: string): string {
  if (href.includes("efficiency")) return ROUTES.efficiency;
  if (href.includes("dividend")) return ROUTES.dividend;
  if (href.includes("budget")) return ROUTES.obg;
  if (href.includes("policies")) return ROUTES.opg;
  if (href.includes("legislation")) return ROUTES.legislation;
  return href;
}

export function LegislationMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-6 text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-black uppercase tracking-tight">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="border-t-4 border-primary pt-6 text-2xl font-black uppercase tracking-tight">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-black uppercase tracking-tight">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm font-bold leading-7 text-muted-foreground">{children}</p>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-foreground bg-muted px-4 py-3 text-sm font-bold text-foreground">
                {children}
              </blockquote>
            ),
            ul: ({ children }) => (
              <ul className="list-disc space-y-2 pl-6 text-sm font-bold text-muted-foreground">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal space-y-2 pl-6 text-sm font-bold text-muted-foreground">{children}</ol>
            ),
            li: ({ children }) => <li>{children}</li>,
            a: ({ href, children }) => {
              const target = normalizeHref(href ?? "#");
              const isExternal = target.startsWith("http");

              if (isExternal) {
                return (
                  <a
                    href={target}
                    target="_blank"
                    rel="noreferrer"
                    className="font-black text-foreground underline underline-offset-4"
                  >
                    {children}
                  </a>
                );
              }

              return (
                <Link
                  href={target}
                  className="font-black text-foreground underline underline-offset-4"
                >
                  {children}
                </Link>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="w-full border-4 border-primary text-left text-sm">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-background text-foreground">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="border-b-2 border-primary px-3 py-2 font-black uppercase">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border-t border-primary px-3 py-2 font-bold text-muted-foreground">{children}</td>
            ),
            code: ({ children }) => (
              <code className="bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="overflow-x-auto border-4 border-primary bg-muted p-4 text-xs font-bold text-foreground">{children}</pre>
            ),
            hr: () => <hr className="border-t-4 border-primary" />,
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
