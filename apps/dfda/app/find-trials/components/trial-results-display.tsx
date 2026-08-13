"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { getClinicalTrialsAction } from '@/lib/actions/get-clinical-trials';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { usePathname } from 'next/navigation';
import type { ClinicalTrialsIntApiResponse } from '@/lib/schemas/clinical-trial.schema';
import type { StudyStatusKey, StudyTypeKey, SexKey, AgeGroupKey } from '@/lib/constants/clinical-trial-filters';
import { TrialCard } from '@/components/shared/TrialCard';

interface TrialResultsDisplayProps {
  initialData?: ClinicalTrialsIntApiResponse;
  initialError?: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

const ITEMS_PER_PAGE = 10; // Should match the 'limit' in getClinicalTrialsAction

export function TrialResultsDisplay({
  initialData,
  initialError,
  searchParams,
}: TrialResultsDisplayProps) {
  const router = useRouter();
  const currentPath = usePathname();

  const [results, setResults] = useState<ClinicalTrialsIntApiResponse | undefined>(initialData);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && !initialError);

  const currentPage = results?.from ? Math.floor(results.from / ITEMS_PER_PAGE) + 1 : 1;
  const totalPages = results?.total ? Math.ceil(results.total / ITEMS_PER_PAGE) : 0;

  useEffect(() => {
    // This effect handles updates if searchParams change externally (e.g. form submission on the same page)
    // or if initialData was not provided (e.g. direct navigation to results page with params)
    // It also ensures that if initialData IS provided, we don't immediately refetch.
    let isMounted = true; // To prevent state updates on unmounted component

    const fetchDataBasedOnParams = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      const sp = new URLSearchParams(searchParams as Record<string, string>);
      const paramsToPass: any = {
        from: parseInt(sp.get('from')?.toString() || '0'),
        limit: ITEMS_PER_PAGE,
      };
      if (sp.has('condition')) paramsToPass.condition = sp.get('condition');
      if (sp.has('intervention')) paramsToPass.intervention = sp.get('intervention');
      if (sp.has('studyStatus')) paramsToPass.studyStatus = sp.get('studyStatus') as StudyStatusKey;
      if (sp.has('studyType')) paramsToPass.studyType = sp.get('studyType') as StudyTypeKey;
      if (sp.has('sex')) paramsToPass.sex = sp.get('sex') as SexKey;
      if (sp.has('ageGroups')) paramsToPass.ageGroups = (sp.get('ageGroups') as string).split(',') as AgeGroupKey[];
      
      if (sp.has('lat') && sp.has('lng')) {
        paramsToPass.lat = parseFloat(sp.get('lat')!);
        paramsToPass.lng = parseFloat(sp.get('lng')!);
        if (sp.has('distance')) paramsToPass.distance = parseInt(sp.get('distance')!, 10);
        if (sp.has('locStr')) paramsToPass.locStr = sp.get('locStr');
      } else if (sp.has('locStr')) {
          paramsToPass.locStr = sp.get('locStr');
      }

      const actionResult = await getClinicalTrialsAction(paramsToPass);
      if (!isMounted) return;

      if ('error' in actionResult) {
        setError(actionResult.error);
        setResults(undefined);
      } else {
        setResults(actionResult);
        setError(null);
      }
      setIsLoading(false);
    };

    if (!initialData && !initialError) {
      fetchDataBasedOnParams();
    } else if (initialData) {
      setResults(initialData);
      setError(null);
      setIsLoading(false);
    } else if (initialError) {
      setError(initialError);
      setResults(undefined);
      setIsLoading(false);
    }
    return () => {
        isMounted = false;
    };
  }, [searchParams, initialData, initialError]);

  // useEffect for scrolling to results
  useEffect(() => {
    if (!isLoading && (results || error)) {
      const resultsSection = document.getElementById('trial-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isLoading, results, error]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || !results) return;
    const newFrom = (newPage - 1) * ITEMS_PER_PAGE;
    const currentParams = new URLSearchParams(searchParams as Record<string, string>);
    currentParams.set('from', newFrom.toString());
    currentParams.set('limit', ITEMS_PER_PAGE.toString());
    router.push(`${currentPath}?${currentParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading clinical trials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error Fetching Trials</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={() => router.push('/find-trials')} className="mt-4">Try a new search</Button>
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.hits || results.hits.length === 0) {
    return (
      <Card className="w-full mt-6">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
          <CardTitle>No Trials Found</CardTitle>
          <CardDescription>
            No clinical trials found.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Displaying {results.hits.length} of {results.total} results.
      </p>
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          Next
        </Button>
      </div>
      {results.hits.map((hit) => {
        const trial = hit.study;
        const nctId = hit.id || trial.protocolSection?.identificationModule?.nctId || trial.NCTId?.[0];
        
        return (
          <TrialCard
            key={nctId || Math.random()}
            study={trial}
            variant="detailed"
            showConditionsLinks={true}
            showInterventionsLinks={true}
          />
        );
      })}
    </div>
  );
} 