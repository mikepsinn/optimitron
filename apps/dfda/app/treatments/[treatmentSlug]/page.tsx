import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import Layout from '@/components/layout';
import { getTreatmentBySlug } from '@/lib/treatments';
import { generateConditionTreatmentPagePath } from '@/lib/path-helpers';
import { ChevronRight, Activity, Shield, Users, FlaskConical } from 'lucide-react';
import { getPrimaryDomain } from '@/lib/site-config';

export const revalidate = 3600; // Revalidate every hour

interface TreatmentPageProps {
  params: Promise<{
    treatmentSlug: string;
  }>;
}

export async function generateMetadata(
  { params: paramsProp }: TreatmentPageProps
): Promise<Metadata> {
  const params = await paramsProp;
  const treatment = getTreatmentBySlug(params.treatmentSlug);
  const treatmentName = treatment?.name || 'Treatment';
  const primaryDomain = getPrimaryDomain();

  return {
    title: `${treatmentName} - Treatment Information`,
    description: `Explore clinical trial data and effectiveness of ${treatmentName} across multiple conditions.`,
    alternates: {
      canonical: `${primaryDomain}/treatments/${params.treatmentSlug}`,
    },
  };
}

export default async function TreatmentPage({ params: paramsProp }: TreatmentPageProps) {
  const params = await paramsProp;
  const { treatmentSlug } = params;

  // Get treatment details from our aggregated data
  const treatment = getTreatmentBySlug(treatmentSlug);

  if (!treatment) {
    logger.warn("[TreatmentPage] Treatment not found:", { treatmentSlug });
    notFound();
  }

  return (
    <Layout>
      <main className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          {/* Treatment Header */}
          <div className="border-b pb-6">
            <div className="flex items-start gap-4">
              <FlaskConical className="h-12 w-12 text-primary" />
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{treatment.name}</h1>
                <p className="text-lg text-muted-foreground">
                  Treatment used for {treatment.conditions.length} condition{treatment.conditions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <FlaskConical className="h-4 w-4" />
                  Total Trials
                </div>
                <div className="text-2xl font-bold mt-1">
                  {treatment.totalTrials.toLocaleString()}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4" />
                  Total Participants
                </div>
                <div className="text-2xl font-bold mt-1">
                  {(treatment.totalParticipants / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4" />
                  Avg Effectiveness
                </div>
                <div className="text-2xl font-bold mt-1">
                  {treatment.avgEffectiveness.toFixed(0)}%
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4" />
                  Avg Safety Score
                </div>
                <div className="text-2xl font-bold mt-1">
                  {treatment.avgSafetyScore.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Conditions List */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Conditions Treated</h2>
            <p className="text-muted-foreground mb-6">
              Click on a condition to view detailed treatment information and clinical trial data.
            </p>
            <div className="space-y-3">
              {treatment.conditions
                .sort((a, b) => b.participants - a.participants)
                .map((condition) => (
                  <Link
                    key={condition.conditionSlug}
                    href={generateConditionTreatmentPagePath(
                      condition.conditionSlug,
                      treatmentSlug
                    )}
                    className="block rounded-lg border p-4 bg-card hover:bg-accent hover:cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-lg mb-2">
                          {condition.conditionName}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Effectiveness:</span>
                            <span className="font-medium ml-1">{condition.effectiveness}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Safety:</span>
                            <span className="font-medium ml-1">{condition.safetyScore}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trials:</span>
                            <span className="font-medium ml-1">{condition.trials.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Participants:</span>
                            <span className="font-medium ml-1">
                              {(condition.participants / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
