import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readerMarkdownComponents } from "@/components/referendum/reader-markdown-components";
import { TreatyNameSignatureBox } from "@/components/treaty/TreatyNameSignatureBox";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { getRouteMetadata } from "@/lib/metadata";
import { getReferendumPageContent } from "@/lib/referendum-content.server";
import { declarationLink } from "@/lib/routes";

export const metadata = getRouteMetadata(declarationLink);

export default async function DeclarationPage() {
  const referendumContent = await getReferendumPageContent(DECLARATION_SLUG);
  const declarationMarkdown = referendumContent?.bodyMarkdown ?? "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <section className="space-y-10">
        <h2 className="text-center text-4xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
          Please quickly skim and sign the Declaration of Optimization.
        </h2>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={readerMarkdownComponents}
        >
          {declarationMarkdown}
        </ReactMarkdown>
      </section>

      <section id="sign-below-declaration" className="mt-12">
        <TreatyNameSignatureBox
          authCallbackUrl="/declaration"
          referendumSlug={DECLARATION_SLUG}
        />
      </section>
    </article>
  );
}
