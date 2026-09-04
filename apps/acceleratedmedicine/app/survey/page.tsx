import type { Metadata } from "next";

import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import Layout from "@/components/layout";
import { parseTrialAbundanceVisualState } from "@optimitron/site-kit/lib/trial-abundance-visual";
import { normalizeUsRegionCode } from "@optimitron/site-kit/lib/us-states";
import {
  SUPPORTER_ROLES,
  US_STATES,
  type StateAbbreviation,
  type SupporterRole,
} from "@/lib/right-to-try";

export const metadata: Metadata = {
  title: "Right to Trial Survey",
  description:
    "Answer three questions about patient access, trial funding, and public priorities. Verify your email to save your response.",
  alternates: {
    canonical: "https://acceleratedmedicine.org/survey",
  },
};

/**
 * `?state=` accepts every form the survey itself accepts ("MO", "US-MO",
 * "Missouri") plus the campaign-page slug ("new-york"), narrowed to the 50
 * states that have campaign pages.
 */
function matchState(value: string | undefined): StateAbbreviation | undefined {
  const code =
    normalizeUsRegionCode(value) ??
    normalizeUsRegionCode(value?.replaceAll("-", " "));
  return US_STATES.find(([, abbreviation]) => abbreviation === code)?.[1];
}

function matchRole(value: string | undefined): SupporterRole | undefined {
  return SUPPORTER_ROLES.find((role) => role === value);
}

export default async function SurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; role?: string; visual?: string }>;
}) {
  const { state, role, visual } = await searchParams;

  return (
    <Layout>
      <StateSupportSection
        headingAs="h1"
        visualState={parseTrialAbundanceVisualState(visual)}
        initialRole={matchRole(role)}
        initialStateCode={matchState(state)}
      />
    </Layout>
  );
}
