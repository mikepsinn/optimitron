import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}): Promise<Metadata> {
  const { organizationSlug } = await params;
  const organization = await getApprovedOrganizationForSurveySlug(organizationSlug);
  if (!organization) return {};

  return {
    title: `${organization.name} ${GLOBAL_SURVEY_NAME}`,
    description:
      "A two-question survey about ending war and disease by funding pragmatic clinical trials.",
  };
}

export default async function OrganizationSurveyPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const organization = await getApprovedOrganizationForSurveySlug(organizationSlug);
  if (!organization) notFound();

  return (
    <main className="min-h-screen bg-[var(--treaty-paper)]">
      <section className="mx-auto max-w-3xl px-4 pb-2 pt-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink-muted)]">
          {organization.name}
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-[var(--treaty-ink)] sm:text-5xl">
          {GLOBAL_SURVEY_NAME}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-[var(--treaty-ink-soft)]">
          Two questions about government funding for pragmatic clinical trials.
          Responses from this link are credited to {organization.name}.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-xs font-black uppercase tracking-wide text-[var(--treaty-ink)] underline"
        >
          Survey Home
        </Link>
      </section>
      <TreatyVoteFlow
        authCallbackUrl={ROUTES.dashboard}
        defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
        organizationSlug={organization.slug}
        postVoteCompletion="message"
        respectStoredFlowVariant={false}
        surface="neutral_org_survey"
      />
    </main>
  );
}
