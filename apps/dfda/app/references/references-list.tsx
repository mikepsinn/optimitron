'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import referencesData from '@/data/references.json';
import type { GeneralResearchCitation, GeneralResearchCitationsData } from '@/types/general-research-citation';
import { GeneralResearchCitationCard } from '@/components/shared/GeneralResearchCitationCard';

// Define Skeleton component separately
export function ReferencesListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ReferencesList() {
  const [references, setReferences] = useState<GeneralResearchCitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load references data from JSON
    try {
      const data = referencesData as GeneralResearchCitationsData;
      setReferences(data.references || []);
    } catch (err) {
      console.error('Failed to load references:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredReferences = useMemo(() => {
    if (!searchQuery) {
      return references;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return references.filter(
      (ref) =>
        ref.title.toLowerCase().includes(lowerCaseQuery) ||
        ref.quotes.some((quote) => quote.toLowerCase().includes(lowerCaseQuery)) ||
        ref.sources.some((source) => source.text.toLowerCase().includes(lowerCaseQuery)) ||
        (ref.notes && ref.notes.toLowerCase().includes(lowerCaseQuery))
    );
  }, [references, searchQuery]);

  if (isLoading) {
    return <ReferencesListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search references by title, quote, or source..."
          className="pl-10 w-full border-4 border-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search references"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredReferences.length} reference{filteredReferences.length !== 1 ? 's' : ''} found
      </div>

      {filteredReferences.length === 0 && !isLoading ? (
        <div className="text-center text-muted-foreground py-8">
          No references found matching your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReferences.map((ref) => (
            <GeneralResearchCitationCard key={ref.id} citation={ref} />
          ))}
        </div>
      )}
    </div>
  );
}

// Assign Skeleton as a static property for external use if desired
ReferencesList.Skeleton = ReferencesListSkeleton;
