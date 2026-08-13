import { FindTrialsForm } from "./components/find-trials-form"
import type { Metadata } from 'next';
import { getClinicalTrialsAction } from '@/lib/actions/get-clinical-trials';
import { TrialResultsDisplay } from './components/trial-results-display';
import { logger } from "@/lib/logger";
import type { ClinicalTrialsIntApiResponse } from '@/lib/schemas/clinical-trial.schema';
import type { AgeGroupKey, SexKey, StudyStatusKey, StudyTypeKey } from '@/lib/constants/clinical-trial-filters';
import { Layout } from '@/components/layout';
import { TreatyWarningBox } from '@/components/shared/TreatyWarningBox';
import { getPrimaryDomain } from '@/lib/site-config';

// Generate metadata
type FindTrialsSearchParams = {
  condition?: string;
  intervention?: string;
  pageToken?: string;
  studyStatus?: string;
  studyType?: string;
  ageGroups?: string;
  sex?: string;
  from?: string;
  limit?: string;
  lat?: string;
  lng?: string;
  locStr?: string;
  distance?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<FindTrialsSearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const primaryDomain = getPrimaryDomain();
  const baseMetadata: Metadata = {
    title: "Find Clinical Trials",
    description: "Search for clinical trials by condition and intervention",
    alternates: {
      canonical: `${primaryDomain}/find-trials`,
    },
  };

  if (resolvedSearchParams?.condition) {
    const conditionName = resolvedSearchParams.condition;
    baseMetadata.title = `Clinical Trials for ${conditionName}`;
    baseMetadata.description = `Find clinical trials for ${conditionName}`;
    if (resolvedSearchParams.intervention) {
      const interventionName = resolvedSearchParams.intervention;
      baseMetadata.title = `${conditionName} Trials: ${interventionName}`;
      baseMetadata.description += ` with intervention ${interventionName}.`;
    }
  }
  return baseMetadata;
}

interface FindTrialsPageProps {
  searchParams?: Promise<FindTrialsSearchParams>;
}

export default async function FindTrialsPage({ searchParams: searchParamsProp }: FindTrialsPageProps) {
  const searchParams = await searchParamsProp;

  let initialData: ClinicalTrialsIntApiResponse | undefined = undefined;
  let initialError: string | undefined = undefined;

  // Convert searchParams to a plain object for easier handling
  const currentSearchParams: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (typeof value === 'string') {
      currentSearchParams[key] = value;
    }
    // We are not handling array values from searchParams directly for initial fetch,
    // as getClinicalTrialsAction expects specific types. Form will handle array construction for ageGroups.
  }

  const condition = currentSearchParams.condition;
  const intervention = currentSearchParams.intervention;
  const studyStatus = currentSearchParams.studyStatus as StudyStatusKey | undefined;
  const studyType = currentSearchParams.studyType as StudyTypeKey | undefined;
  const ageGroups = currentSearchParams.ageGroups?.split(',') as AgeGroupKey[] | undefined;
  const sex = currentSearchParams.sex as SexKey | undefined;
  const from = currentSearchParams.from ? parseInt(currentSearchParams.from, 10) : 0;
  const limit = currentSearchParams.limit ? parseInt(currentSearchParams.limit, 10) : 10; // Default to 10, same as in display
  const lat = currentSearchParams.lat ? parseFloat(currentSearchParams.lat) : undefined;
  const lng = currentSearchParams.lng ? parseFloat(currentSearchParams.lng) : undefined;
  const locStr = currentSearchParams.locStr;
  const distance = currentSearchParams.distance ? parseInt(currentSearchParams.distance, 10) : undefined;

  // Fetch initial results if a condition, intervention or location info is present
  if (condition || intervention || (lat && lng) || locStr) {
    try {
      const result = await getClinicalTrialsAction({
        condition,
        intervention,
        studyStatus,
        studyType,
        ageGroups,
        sex,
        from,
        limit,
        lat,
        lng,
        locStr,
        distance,
      });

      if ("error" in result) {
        initialError = result.error;
        logger.error(`[FindTrialsPage] Error fetching initial trials: ${result.error}`, { searchParams: currentSearchParams });
      } else {
        initialData = result;
      }
    } catch (e: any) {
      initialError = "An unexpected error occurred while fetching trial data.";
      logger.error("[FindTrialsPage] Exception fetching initial trials:", { error: e.message, searchParams: currentSearchParams });
    }
  }

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto py-6 px-4 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {condition ? `Clinical Trials for ${condition}` : "Find Clinical Trials"}
          </h1>
          {intervention && <p className="text-xl text-muted-foreground mt-1">Focusing on: {intervention}</p>}
          {!condition && (
              <p className="text-lg text-muted-foreground mt-2">
              Search for clinical trials by medical condition and optionally by intervention.
              </p>
          )}
        </header>

        {/* Treaty Warning Box */}
        <TreatyWarningBox />

        <FindTrialsForm
          initialCondition={condition}
          initialIntervention={intervention}
          initialStudyStatus={studyStatus}
          initialStudyType={studyType}
          initialAgeGroups={ageGroups}
          initialSex={sex}
          initialLocation={locStr}
          initialLat={lat}
          initialLng={lng}
          initialRadius={distance}
        />

        {(condition || intervention || locStr || initialData || initialError) && (
          <section id="trial-results" className="mt-12">
            <TrialResultsDisplay
              initialData={initialData}
              initialError={initialError}
              searchParams={currentSearchParams}
            />
          </section>
        )}
      </div>
    </Layout>
  )
}
