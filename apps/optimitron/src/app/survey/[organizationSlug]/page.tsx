import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GLOBAL_SURVEY_NAME } from "@/lib/messaging";
import { getApprovedOrganizationForSurveySlug } from "@/lib/organization.server";
import { ROUTES, trialSurveyLink } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";
import { SurveyVoteFlowClient } from "../SurveyVoteFlowClient";

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
      <SurveyVoteFlowClient
        authCallbackUrl={ROUTES.dashboard}
        compactInitialScreen
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
