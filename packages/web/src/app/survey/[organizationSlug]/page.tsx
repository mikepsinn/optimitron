import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";
import { ROUTES, trialSurveyLink } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}): Promise<Metadata> {
  const { organizationSlug } = await params;
  const organization =
    await getApprovedOrganizationForSurveySlug(organizationSlug);
  if (!organization) return {};

  return {
    title: `${organization.name} | ${GLOBAL_SURVEY_NAME}`,
    description: trialSurveyLink.description,
  };
}

export default async function OrganizationSurveyPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;
  const organization =
    await getApprovedOrganizationForSurveySlug(organizationSlug);
  if (!organization) notFound();

  return (
    <main className="min-h-screen bg-[var(--treaty-paper)]">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 text-xs font-black uppercase tracking-wide text-[var(--treaty-ink-muted)]">
        <p className="truncate">{organization.name}</p>
        <Link href="/" className="shrink-0 text-[var(--treaty-ink)] underline">
          Survey Home
        </Link>
      </header>
      <TreatyVoteFlow
        authCallbackUrl={ROUTES.dashboard}
        defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
        organizationSlug={organization.slug}
        postVoteCompletion="message"
        respectStoredFlowVariant={false}
        sliderHeadline={GLOBAL_SURVEY_NAME}
        surface="neutral_org_survey"
      />
    </main>
  );
}
