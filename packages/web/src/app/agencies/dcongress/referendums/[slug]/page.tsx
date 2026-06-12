import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { ReferendumVoteSection } from "@/components/referendum/ReferendumVoteSection";
import { readerMarkdownComponents } from "@/components/referendum/reader-markdown-components";
import { ReferendumSiteInlineSign } from "@/components/site/ReferendumSiteInlineSign";
import { TreatyNameSignatureBox } from "@/components/treaty/TreatyNameSignatureBox";
import { ROUTES } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const referendum = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: { title: true, question: true, description: true },
  });

  if (!referendum) return { title: "Referendum Not Found" };

  return {
    title: `${referendum.title} | Optimitron`,
    description: referendum.description ?? referendum.question,
  };
}

export default async function ReferendumPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const referendumPath = `${ROUTES.referendum}/${slug}`;
  const isTreatyReferendum = slug === TREATY_REFERENDUM_SLUG;

  const referendum = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
  });

  if (!referendum) notFound();

  const user = await getCurrentUser();

  const existingVote = user?.personId
    ? await prisma.referendumVote.findUnique({
        where: {
          referendumId_personId: {
            referendumId: referendum.id,
            personId: user.personId,
          },
        },
        select: { answer: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground mb-3">
          Referendum
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
          {referendum.title}
        </h1>
        {referendum.description && (
          <p className="text-lg text-foreground leading-relaxed font-bold">
            {referendum.description}
          </p>
        )}
        <div className="mt-8 max-w-2xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-foreground">
            Ballot Question
          </p>
          <p className="text-xl font-black leading-snug text-foreground sm:text-2xl">
            {referendum.question}
          </p>
        </div>
      </section>

      {/* Voting + sharing */}
      <section className="mb-16">
        {isTreatyReferendum ? (
          <div
            aria-label="Cast your vote"
            className="max-w-md"
          >
            <ReferendumSiteInlineSign
              referendumSlug={slug}
              referralCode={ref ?? null}
              authCallbackUrl={referendumPath}
              authPromptText=""
              authTitle={null}
              emailButtonLabel="Email Me a Link"
              emailPendingButtonLabel="Sending Link..."
              googleButtonLabel="Continue with Google"
              showDemoAuth={false}
              hideAuthContainer
              variant="reader"
              showReaderShell={false}
            />
          </div>
        ) : (
          <ReferendumVoteSection
            referendumSlug={slug}
            isActive={referendum.status === "ACTIVE"}
            isAuthenticated={!!user}
            existingAnswer={existingVote?.answer ?? null}
            referralCode={ref ?? null}
            username={user?.person?.handle ?? user?.referralCode ?? null}
          />
        )}
      </section>

      {referendum.bodyMarkdown && (
        <section className="mb-12 bg-[var(--treaty-paper)] text-[var(--treaty-ink)]">
          <div className="mx-auto max-w-2xl space-y-10">
            <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={readerMarkdownComponents}
            >
              {referendum.bodyMarkdown}
            </ReactMarkdown>
            <div className="mx-auto h-px w-24 bg-[var(--treaty-ink-muted)]" />
          </div>
        </section>
      )}

      {isTreatyReferendum ? (
        <section
          id="sign-the-treaty"
          className="mb-12 pt-4"
          aria-label="Sign the treaty"
        >
          <TreatyNameSignatureBox
            authCallbackUrl={referendumPath}
            referralCode={ref ?? null}
            referendumSlug={slug}
          />
        </section>
      ) : null}
    </div>
  );
}
