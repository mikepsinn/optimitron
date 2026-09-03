import type { Metadata } from "next";

import { StateSupportSection } from "@/components/landing/right-to-try-sections";
import Layout from "@/components/layout";
import { parseTrialAbundanceVisualState } from "@optimitron/site-kit/lib/trial-abundance-visual";
import {
  stateSlug,
  SUPPORTER_ROLES,
  US_STATES,
  type StateName,
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

function matchState(value: string | undefined): StateName | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const match = US_STATES.find(
    ([name]) =>
      name.toLowerCase() === normalized || stateSlug(name) === normalized,
  );
  return match?.[0];
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
        initialState={matchState(state)}
      />
    </Layout>
  );
}
