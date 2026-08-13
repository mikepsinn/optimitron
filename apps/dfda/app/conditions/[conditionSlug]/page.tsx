import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { logger } from '@/lib/logger';
import Layout from '@/components/layout';
import { TreatmentRankings } from '@/components/condition/TreatmentRankings';
import { getConditionBySlug } from '@/lib/conditions';
import { getPrimaryDomain } from '@/lib/site-config';

export const revalidate = 3600; // Revalidate every hour

interface ConditionPageProps {
  params: Promise<{
    conditionSlug: string;
  }>;
}

export async function generateMetadata(
  { params: paramsProp }: ConditionPageProps
): Promise<Metadata> {
  const params = await paramsProp;
  const condition = getConditionBySlug(params.conditionSlug);
  const conditionName = condition?.name || 'Condition';
  const primaryDomain = getPrimaryDomain();

  return {
    title: `${conditionName} - Treatment Rankings`,
    description: `Explore evidence-based treatment rankings and clinical trials for ${conditionName}.`,
    alternates: {
      canonical: `${primaryDomain}/conditions/${params.conditionSlug}`,
    },
  };
}

export default async function ConditionPage({ params: paramsProp }: ConditionPageProps) {
  const params = await paramsProp;
  const { conditionSlug } = params;

  // Get condition details from our data
  const condition = getConditionBySlug(conditionSlug);

  if (!condition) {
    logger.warn("[ConditionPage] Condition not found:", { conditionSlug });
    notFound();
  }

  const conditionName = condition.name;

  return (
    <Layout>
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          {/* Condition Header */}
          <div className="border-b pb-6">
            <div className="flex items-start gap-4">
              {condition.emoji && (
                <span className="text-5xl">{condition.emoji}</span>
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{condition.name}</h1>
                {condition.description && (
                  <p className="text-lg text-muted-foreground">{condition.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">People Affected</div>
                <div className="text-2xl font-bold mt-1">
                  {(condition.peopleAffected / 1_000_000).toFixed(1)}M
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Active Trials</div>
                <div className="text-2xl font-bold mt-1">{condition.activeTrialCount}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">New Cases/Year</div>
                <div className="text-2xl font-bold mt-1">
                  {(condition.newCasesPerYear / 1_000_000).toFixed(1)}M
                </div>
              </div>
              {condition.deathsPerYear > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Deaths/Year</div>
                  <div className="text-2xl font-bold mt-1">
                    {(condition.deathsPerYear / 1_000).toFixed(1)}K
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Treatment Rankings */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Treatment Rankings</h2>
            <p className="text-muted-foreground mb-6">
              Treatments are ranked by the number of clinical trials conducted.
            </p>
            <TreatmentRankings conditionName={conditionName} />
          </div>
        </div>
      </main>
    </Layout>
  );
}
