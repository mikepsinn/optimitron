'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronRight, FlaskConical, Shield, TrendingUp } from 'lucide-react';
import { getTreatmentsAction } from '@/lib/actions/treatments';
import { logger } from '@/lib/logger';
import type { TreatmentWithConditions } from '@/lib/treatments';
import { formatNumberShort } from '@/lib/formatters';

// Define Skeleton component separately
export function TreatmentsListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TreatmentsList() {
  const [treatments, setTreatments] = useState<TreatmentWithConditions[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTreatments() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTreatmentsAction();
        setTreatments(data || []);
      } catch (err) {
        logger.error('Failed to fetch treatments in client component:', err);
        setError('Failed to load treatments. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTreatments();
  }, []);

  const filteredTreatments = useMemo(() => {
    if (!searchQuery) {
      return treatments;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return treatments.filter((treatment) =>
      treatment.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [treatments, searchQuery]);

  if (isLoading) {
    return <TreatmentsListSkeleton />;
  }

  if (error) {
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search treatments by name..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search treatments"
        />
      </div>

      {filteredTreatments.length === 0 && !isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          No treatments found matching your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTreatments.map((treatment) => (
            <Link
              key={treatment.slug}
              href={`/treatments/${treatment.slug}`}
              className="block rounded-lg border-2 border-black p-4 bg-white hover:bg-brutal-cyan/20 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <FlaskConical className="h-6 w-6 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-lg mb-3">{treatment.name}</div>

                    {/* Score Badges */}
                    <div className="flex gap-2 mb-3">
                      {/* Effectiveness Score */}
                      <div className="flex items-center gap-1.5 bg-green-100 border-2 border-black px-3 py-1 rounded-full">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-xs font-black">
                          {(treatment.avgEffectiveness / 10).toFixed(1)}/10
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          Effective
                        </span>
                      </div>

                      {/* Safety Score */}
                      <div className="flex items-center gap-1.5 bg-blue-100 border-2 border-black px-3 py-1 rounded-full">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-xs font-black">
                          {(treatment.avgSafetyScore / 10).toFixed(1)}/10
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          Safe
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Conditions */}
                      <div className="bg-brutal-pink/20 border-2 border-black p-2 rounded">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Conditions
                        </div>
                        <div className="font-black text-sm">
                          {treatment.conditions.length}
                        </div>
                      </div>

                      {/* Trials */}
                      <div className="bg-brutal-yellow/30 border-2 border-black p-2 rounded">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Trials
                        </div>
                        <div className="font-black text-sm">
                          {treatment.totalTrials.toLocaleString()}
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="bg-brutal-cyan/20 border-2 border-black p-2 rounded">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          People
                        </div>
                        <div className="font-black text-sm">
                          {formatNumberShort(treatment.totalParticipants)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 flex-shrink-0 font-bold" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Assign Skeleton as a static property for external use if desired (e.g. by Suspense fallback pattern)
TreatmentsList.Skeleton = TreatmentsListSkeleton;
