import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getTreatmentsByConditionSlug } from '@/lib/actions/treatments';
import { getClinicalTrialsAction } from '@/lib/actions/get-clinical-trials';
import { TreatmentReport } from './components/treatment-report';
import { TreatmentTrials } from './components/treatment-trials';
import type { TreatmentForCondition } from '@/types/treatment';
import type { ClinicalTrialsIntApiResponse } from '@/lib/schemas/clinical-trial.schema';
import { nameToSlug } from '@/lib/path-helpers';
import { getPrimaryDomain } from '@/lib/site-config';

interface TreatmentDetailPageProps {
  params: Promise<{
    conditionSlug: string;
    treatmentSlug: string;
  }>;
}

// Helper to convert slug back to name (approximation)
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: TreatmentDetailPageProps): Promise<Metadata> {
  const { conditionSlug, treatmentSlug } = await params;
  const conditionName = slugToName(conditionSlug);
  const treatmentName = slugToName(treatmentSlug);
  const primaryDomain = getPrimaryDomain();

  return {
    title: `${treatmentName} for ${conditionName}`,
    description: `Comprehensive information about ${treatmentName} as a treatment for ${conditionName}, including effectiveness, safety, costs, and clinical trials.`,
    alternates: {
      canonical: `${primaryDomain}/conditions/${conditionSlug}/treatments/${treatmentSlug}`,
    },
  };
}

export default async function TreatmentDetailPage({ params }: TreatmentDetailPageProps) {
  const { conditionSlug, treatmentSlug } = await params;
  const conditionName = slugToName(conditionSlug);

  // Fetch treatment data for this condition
  const conditionData = await getTreatmentsByConditionSlug(conditionSlug);

  if (!conditionData) {
    notFound();
  }

  // Find the specific treatment
  const treatment = conditionData.treatments.find(
    (t: TreatmentForCondition) => nameToSlug(t.name) === treatmentSlug
  );

  if (!treatment) {
    notFound();
  }

  // Fetch clinical trials for this condition + treatment combination
  let trialsData: ClinicalTrialsIntApiResponse | null = null;
  let trialsError: string | null = null;

  try {
    const result = await getClinicalTrialsAction({
      condition: conditionName,
      intervention: treatment.name,
      limit: 20,
    });

    if ('error' in result) {
      trialsError = result.error;
    } else {
      trialsData = result;
    }
  } catch (error) {
    console.error('Error fetching trials:', error);
    trialsError = 'Failed to load clinical trials';
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6 px-4 space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {treatment.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            Treatment for {conditionName}
          </p>
          {treatment.dosageRange && (
            <p className="text-sm text-muted-foreground">
              Typical Dosage: {treatment.dosageRange}
            </p>
          )}
        </header>

        {/* Treatment Report - Comprehensive overview */}
        <TreatmentReport treatment={treatment} conditionName={conditionName} />

        {/* Clinical Trials Section */}
        <TreatmentTrials
          treatment={treatment}
          conditionName={conditionName}
          trialsData={trialsData}
          trialsError={trialsError}
        />
      </div>
    </Layout>
  );
}
