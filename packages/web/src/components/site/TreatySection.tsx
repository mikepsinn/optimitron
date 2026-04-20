import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";

const treatyMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-center text-4xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-center text-2xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-3xl">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-12 text-left text-lg leading-9 text-[#2f2417] drop-cap-deep [font-family:var(--v0-font-libre-baskerville)] last:mb-0 sm:mb-14 sm:text-[1.35rem]">
      {children}
    </p>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const target = href ?? "#";
    const linkClass =
      "font-black text-[#5e2e1f] underline decoration-[#8e6b48]/60 decoration-2 underline-offset-4 transition-colors hover:text-[#2f2417] hover:decoration-[#2f2417]";
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
    <blockquote className="border-l-4 border-[#8e6b48] bg-[#efe4cf]/70 px-5 py-4 text-left text-base font-bold text-[#3a2a19] shadow-[6px_6px_0_rgba(58,42,25,0.08)]">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc space-y-3 pl-6 text-left text-base font-bold text-[#3a2a19] sm:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal space-y-3 pl-6 text-left text-base font-bold text-[#3a2a19] sm:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  hr: () => <hr className="border-t-2 border-[#8e6b48]/40" />,
};

interface TreatySectionProps {
  treatyMarkdown: string;
  referendumSlug: string | null;
}

export function TreatySection({
  treatyMarkdown,
  referendumSlug,
}: TreatySectionProps) {
  if (!treatyMarkdown) return null;
  return (
    <>
      <section className="mt-16 border-t-2 border-foreground pt-12">
        <p className="mx-auto max-w-3xl text-center text-lg font-bold leading-relaxed text-[#2f2417] [font-family:var(--v0-font-libre-baskerville)] sm:text-xl md:text-2xl">
          Given your leaders are very busy promoting the general welfare by blowing up schoolchildren and global energy infrastructure, they may not have 30 seconds to end war and disease. So you can do it for them!
        </p>
      </section>

      <section className="mt-12">
        <div className="mx-auto max-w-3xl space-y-10">
          <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl md:text-5xl">
            Please quickly skim and sign to end war and disease.
          </h2>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={treatyMarkdownComponents}
          >
            {treatyMarkdown}
          </ReactMarkdown>
        </div>
      </section>

      <section id="sign-below-treaty" className="mt-12">
        <ReferendumSiteInlineSign
          referendumSlug={referendumSlug}
          showPrivacyToggle
        />
      </section>
    </>
  );
}
