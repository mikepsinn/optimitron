import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  getAllConditions,
  getAllTreatments,
  getConditionBySlug,
  getTreatmentBySlug,
  getTreatmentForCondition,
  getTreatmentsByConditionSlug,
  medicalNameToSlug,
  type TreatmentForCondition,
} from "@optimitron/data/datasets/medical";
import { TreatmentRankings } from "@/components/condition/TreatmentRankings";
import { TreatmentReport } from "@/components/medical/TreatmentReport";
import { TreatmentTrials } from "@/components/medical/TreatmentTrials";
import { BrutalCard } from "@/components/ui/brutal-card";
import { StatCardGrid } from "@/components/ui/stat-card";
import { fetchClinicalTrials } from "@/lib/medical/clinical-trials.server";
import type { ClinicalTrialsIntApiResponse } from "@/lib/medical/clinical-trials.schema";
import { getRouteMetadata } from "@/lib/metadata";
import { conditionsLink, ROUTES, treatmentsLink } from "@/lib/routes";
import { getSiteFromHeaders, type SiteConfig } from "@/lib/site";

export const conditionsMetadata: Metadata = getRouteMetadata(conditionsLink);
export const treatmentsMetadata: Metadata = getRouteMetadata(treatmentsLink);

async function getRequestSite() {
  const hdrs = await headers();
  return getSiteFromHeaders(hdrs);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: value >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function getConditionsBasePath(site: SiteConfig) {
  return site.key === "dfda" ? "/conditions" : ROUTES.conditions;
}

function getTreatmentsBasePath(site: SiteConfig) {
  return site.key === "dfda" ? "/treatments" : ROUTES.treatments;
}

function getConditionPath(site: SiteConfig, conditionSlug: string) {
  return `${getConditionsBasePath(site)}/${conditionSlug}`;
}

function getTreatmentPath(site: SiteConfig, treatmentSlug: string) {
  return `${getTreatmentsBasePath(site)}/${treatmentSlug}`;
}

function getConditionTreatmentPath(
  site: SiteConfig,
  conditionSlug: string,
  treatmentSlug: string,
) {
  return `${getConditionPath(site, conditionSlug)}/treatments/${treatmentSlug}`;
}

function withCanonical(metadata: Metadata, site: SiteConfig, path: string): Metadata {
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: `${site.canonicalOrigin}${path}`,
    },
  };
}

export async function generateConditionsIndexMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return withCanonical(conditionsMetadata, site, getConditionsBasePath(site));
}

export async function generateTreatmentsIndexMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return withCanonical(treatmentsMetadata, site, getTreatmentsBasePath(site));
}

function conditionTreatmentFallback(
  treatmentSlug: string,
  conditionSlug: string,
): TreatmentForCondition | null {
  const treatment = getTreatmentBySlug(treatmentSlug);
  const condition = treatment?.conditions.find(
    (entry) => entry.conditionSlug === conditionSlug,
  );
  if (!treatment || !condition) return null;

  return {
    confidenceScore: 0,
    effectiveness: condition.effectiveness,
    name: treatment.name,
    participants: condition.participants,
    safetyScore: condition.safetyScore,
    sideEffects: [],
    trials: condition.trials,
  };
}

export async function ConditionsPage() {
  const site = await getRequestSite();
  const conditions = [...getAllConditions()].sort(
    (a, b) => b.peopleAffected - a.peopleAffected,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          DFDA
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
          Conditions
        </h1>
        <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-muted-foreground">
          {conditions.length.toLocaleString()} conditions. Treatments ranked by
          evidence, not whoever bought the prettiest brochure.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {conditions.map((condition) => (
          <Link key={condition.slug} href={getConditionPath(site, condition.slug)}>
            <BrutalCard hover padding="md" shadowSize={4} className="h-full">
              <div className="flex items-start gap-3">
                <span className="text-3xl" aria-hidden>
                  {condition.emoji}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black uppercase">
                    {condition.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-muted-foreground">
                    {condition.description}
                  </p>
                  <p className="mt-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
                    {formatCompactNumber(condition.peopleAffected)} affected ·{" "}
                    {condition.activeTrialCount.toLocaleString()} active trials
                  </p>
                </div>
              </div>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </main>
  );
}

export async function generateConditionMetadata({
  params,
}: {
  params: Promise<{ conditionSlug: string }>;
}): Promise<Metadata> {
  const { conditionSlug } = await params;
  const condition = getConditionBySlug(conditionSlug);
  if (!condition) return {};

  const site = await getRequestSite();
  return withCanonical({
    title: `${condition.name} Treatment Rankings | DFDA`,
    description: `Explore evidence-based treatment rankings and clinical trials for ${condition.name}.`,
  }, site, getConditionPath(site, condition.slug));
}

export async function ConditionPage({
  params,
}: {
  params: Promise<{ conditionSlug: string }>;
}) {
  const { conditionSlug } = await params;
  const condition = getConditionBySlug(conditionSlug);
  if (!condition) notFound();

  const comparisonData = await getTreatmentsByConditionSlug(condition.slug);

  return (
    <main className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="border-b-4 border-foreground pb-8">
        <div className="flex items-start gap-4">
          {condition.emoji ? (
            <span className="text-5xl" aria-hidden>
              {condition.emoji}
            </span>
          ) : null}
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Condition
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
              {condition.name}
            </h1>
            {condition.description ? (
              <p className="mt-3 text-lg font-bold text-muted-foreground">
                {condition.description}
              </p>
            ) : null}
          </div>
        </div>

        <StatCardGrid
          className="mt-6"
          columns={4}
          stats={[
            {
              label: "People Affected",
              value: formatCompactNumber(condition.peopleAffected),
              color: "pink",
              size: "sm",
            },
            {
              label: "Active Trials",
              value: condition.activeTrialCount.toLocaleString(),
              color: "cyan",
              size: "sm",
            },
            {
              label: "New Cases/Year",
              value: formatCompactNumber(condition.newCasesPerYear),
              color: "yellow",
              size: "sm",
            },
            ...(condition.deathsPerYear > 0
              ? [
                  {
                    label: "Deaths/Year",
                    value: formatCompactNumber(condition.deathsPerYear),
                    color: "green" as const,
                    size: "sm" as const,
                  },
                ]
              : []),
          ]}
        />
      </div>

      <div>
        <h2 className="mb-4 text-3xl font-black uppercase">
          Treatment Rankings
        </h2>
        <p className="mb-6 text-base font-bold text-muted-foreground">
          Ranked by evidence volume first. Medicine has spent centuries ranking
          things by vibes. This is an improvement.
        </p>
        <TreatmentRankings
          comparisonData={comparisonData}
          conditionName={condition.name}
        />
      </div>
    </main>
  );
}

export async function generateConditionTreatmentMetadata({
  params,
}: {
  params: Promise<{ conditionSlug: string; treatmentSlug: string }>;
}): Promise<Metadata> {
  const { conditionSlug, treatmentSlug } = await params;
  const condition = getConditionBySlug(conditionSlug);
  const treatment =
    (await getTreatmentForCondition(conditionSlug, treatmentSlug)) ??
    conditionTreatmentFallback(treatmentSlug, conditionSlug);
  if (!condition || !treatment) return {};

  const site = await getRequestSite();
  return withCanonical({
    title: `${treatment.name} for ${condition.name} | DFDA`,
    description: `Comprehensive information about ${treatment.name} as a treatment for ${condition.name}, including effectiveness, safety, costs, and clinical trials.`,
  }, site, getConditionTreatmentPath(site, condition.slug, treatmentSlug));
}

export async function ConditionTreatmentPage({
  params,
}: {
  params: Promise<{ conditionSlug: string; treatmentSlug: string }>;
}) {
  const { conditionSlug, treatmentSlug } = await params;
  const condition = getConditionBySlug(conditionSlug);
  if (!condition) notFound();

  const treatment =
    (await getTreatmentForCondition(condition.slug, treatmentSlug)) ??
    conditionTreatmentFallback(treatmentSlug, condition.slug);
  if (!treatment) notFound();

  let trialsData: ClinicalTrialsIntApiResponse | null = null;
  let trialsError: string | null = null;

  try {
    trialsData = await fetchClinicalTrials({
      condition: condition.name,
      intervention: treatment.name,
      limit: 20,
    });
  } catch {
    trialsError = "Failed to load clinical trials";
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-8 px-4 py-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {treatment.name}
        </h1>
        <p className="text-xl text-muted-foreground">
          Treatment for {condition.name}
        </p>
        {treatment.dosageRange ? (
          <p className="text-sm text-muted-foreground">
            Typical Dosage: {treatment.dosageRange}
          </p>
        ) : null}
      </header>

      <TreatmentReport treatment={treatment} conditionName={condition.name} />
      <TreatmentTrials
        conditionName={condition.name}
        treatment={treatment}
        trialsData={trialsData}
        trialsError={trialsError}
      />
    </main>
  );
}

export async function TreatmentsPage() {
  const site = await getRequestSite();
  const treatments = [...getAllTreatments()].sort(
    (a, b) => b.totalParticipants - a.totalParticipants,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          DFDA
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
          Treatments
        </h1>
        <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-muted-foreground">
          {treatments.length.toLocaleString()} treatments. Sorted by trials,
          participants, effectiveness, and safety. Radical concept: compare
          the evidence before swallowing things.
        </p>
      </header>

      <div className="space-y-4">
        {treatments.map((treatment) => (
          <Link key={treatment.slug} href={getTreatmentPath(site, treatment.slug)}>
            <BrutalCard hover padding="md" shadowSize={4}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="text-lg font-black uppercase">
                    {treatment.name}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">
                    Used for {treatment.conditions.length.toLocaleString()}{" "}
                    condition{treatment.conditions.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-sm font-black uppercase text-muted-foreground">
                  {treatment.totalTrials.toLocaleString()} trials ·{" "}
                  {formatCompactNumber(treatment.totalParticipants)} participants
                </div>
              </div>
            </BrutalCard>
          </Link>
        ))}
      </div>
    </main>
  );
}

export async function generateTreatmentMetadata({
  params,
}: {
  params: Promise<{ treatmentSlug: string }>;
}): Promise<Metadata> {
  const { treatmentSlug } = await params;
  const treatment = getTreatmentBySlug(treatmentSlug);
  if (!treatment) return {};

  const site = await getRequestSite();
  return withCanonical({
    title: `${treatment.name} | DFDA`,
    description: `Treatment evidence across ${treatment.conditions.length} conditions.`,
  }, site, getTreatmentPath(site, treatment.slug));
}

export async function TreatmentPage({
  params,
}: {
  params: Promise<{ treatmentSlug: string }>;
}) {
  const { treatmentSlug } = await params;
  const treatment = getTreatmentBySlug(treatmentSlug);
  if (!treatment) notFound();
  const site = await getRequestSite();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href={getTreatmentsBasePath(site)}
        className="text-sm font-black uppercase underline"
      >
        Back to Treatments
      </Link>

      <header className="mt-6 border-b-4 border-foreground pb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Treatment
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">
          {treatment.name}
        </h1>
        <div className="mt-6">
          <StatCardGrid
            columns={4}
            stats={[
              {
                label: "Conditions",
                value: treatment.conditions.length.toLocaleString(),
                color: "yellow",
              },
              {
                label: "Trials",
                value: treatment.totalTrials.toLocaleString(),
                color: "cyan",
              },
              {
                label: "Participants",
                value: formatCompactNumber(treatment.totalParticipants),
                color: "pink",
              },
              {
                label: "Average Safety",
                value: `${Math.round(treatment.avgSafetyScore)}%`,
                color: "green",
              },
            ]}
          />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-black uppercase">Condition Evidence</h2>
        <div className="mt-5 space-y-4">
          {treatment.conditions.map((condition) => (
            <Link
              key={condition.conditionSlug}
              href={getConditionTreatmentPath(
                site,
                condition.conditionSlug,
                treatment.slug,
              )}
            >
              <BrutalCard hover padding="md" shadowSize={4}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <h3 className="text-lg font-black uppercase">
                      {condition.conditionName}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-muted-foreground">
                      {condition.trials.toLocaleString()} trials ·{" "}
                      {formatCompactNumber(condition.participants)} participants
                    </p>
                  </div>
                  <div className="text-sm font-black uppercase text-muted-foreground">
                    {Math.round(condition.effectiveness)}% effectiveness ·{" "}
                    {Math.round(condition.safetyScore)}% safety
                  </div>
                </div>
              </BrutalCard>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
