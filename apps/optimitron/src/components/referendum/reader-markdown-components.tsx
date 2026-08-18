import Link from "next/link";
import type { ReactNode } from "react";

// Plain (non-"use client") module so server components can render react-markdown
// with these components without crossing the RSC client boundary. When this
// lived inside ReferendumStepper.tsx (a "use client" file), the bare `<p>`
// tags rendered by `/treaty` had no classes — the components were silently
// stripped at the server/client boundary.

export const readerMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-center text-4xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-center text-2xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-8 text-left text-lg leading-9 text-[var(--treaty-ink-soft)] drop-cap [font-family:var(--v0-font-libre-baskerville)] last:mb-0 sm:mb-10 sm:text-[1.35rem]">
      {children}
    </p>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const target = href ?? "#";
    const linkClass =
      "font-black text-[var(--treaty-ink)] underline decoration-[var(--treaty-ink)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--treaty-ink-soft)]";
    if (target.startsWith("http")) {
      return (
        <a href={target} target="_blank" rel="noreferrer" className={linkClass}>
          {children}
        </a>
      );
    }
    return (
      <Link href={target} className={linkClass}>
        {children}
      </Link>
    );
  },
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-l-4 border-[var(--treaty-ink)] bg-[var(--treaty-paper)] px-5 py-4 text-left text-base font-bold text-[var(--treaty-ink)]">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc space-y-3 pl-6 text-left text-base font-bold text-[var(--treaty-ink)] sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal space-y-3 pl-6 text-left text-base font-bold text-[var(--treaty-ink)] sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  hr: () => <hr className="border-t-2 border-[var(--treaty-ink-muted)]" />,
};
