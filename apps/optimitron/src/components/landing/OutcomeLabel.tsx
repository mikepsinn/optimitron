'use client';

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { cn } from "@/lib/utils"; // Import cn utility
import { ClinicalStudyCitationDisplay } from './ClinicalStudyCitationDisplay'; // Import the new component
import type { OutcomeFooterData } from '@/lib/types/clinical-study-citation'; // Import the updated footer type
import { getGroundedAnswerAction } from '@/lib/actions/google-grounded-search';
import type { GroundedSearchResult } from '@/lib/types/grounded-search';
import { Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2 and AlertTriangle

export interface OutcomeValue {
  percentage: number;
  absolute?: string; // e.g., "-69 mg/dL"
  nnh?: number;
}

export interface OutcomeItem {
  name: string;
  baseline?: string; // e.g., "(baseline: 160 mg/dL)"
  value: OutcomeValue;
  isPositive?: boolean; // Green if true, Red if false, Amber if undefined (for side effects)
}

export interface OutcomeCategory {
  title: string;
  items: OutcomeItem[];
  isSideEffectCategory?: boolean; // To apply specific styling/logic for side effects
}

export interface OutcomeLabelProps {
  title: string;
  subtitle?: string; // e.g., "Lipid-lowering agent"
  tag?: string; // Optional tag, e.g., "Drug Class"
  data?: OutcomeCategory[]; // Made data optional to trigger fetch if not provided
  footer?: OutcomeFooterData; // Use the updated footer type from the action
}

export function OutcomeLabel({ title, subtitle, tag, data, footer }: OutcomeLabelProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedInfo, setFetchedInfo] = useState<GroundedSearchResult | null>(null);

  useEffect(() => {
    if ((!data || data.length === 0) && title) {
      const fetchData = async () => {
        setIsLoading(true);
        setFetchError(null);
        setFetchedInfo(null);
        try {
          const result = await getGroundedAnswerAction(title);
          if (result) {
            setFetchedInfo(result);
          } else {
            setFetchError('No information found or an error occurred during fetching.');
          }
        } catch (error) {
          console.error("Error fetching grounded answer:", error);
          setFetchError('Failed to fetch outcome information.');
        }
        setIsLoading(false);
      };
      fetchData();
    } else {
      // If data is provided, or title is missing, reset fetch states
      setIsLoading(false);
      setFetchError(null);
      setFetchedInfo(null);
    }
  }, [title, data]);

  const renderProgressBar = (item: OutcomeItem, isSideEffect: boolean = false) => {
    // Determine color based on positivity or if it's a side effect
    const colorClass = isSideEffect
      ? 'bg-amber-500' // Use amber for side effects if isPositive is not explicitly set
      : item.isPositive === true
        ? 'bg-green-600'
        : item.isPositive === false
          ? 'bg-red-600'
          : 'bg-gray-400'; // Default or neutral color if positivity is undefined and not a side effect

    const textColorClass = isSideEffect
        ? 'text-red-600' // Side effects usually shown in red/amber text
        : item.isPositive === true
          ? 'text-green-600'
          : item.isPositive === false
            ? 'text-red-600'
            : 'text-gray-700';

    const valueString = `${item.value.percentage > 0 ? '+' : ''}${item.value.percentage}%` +
                        (item.value.absolute ? ` (${item.value.absolute})` : '') +
                        (item.value.nnh ? ` (NNH: ${item.value.nnh})` : '');

    return (
      <div key={item.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div className="flex items-center">
          <span className="text-sm">{item.name}</span>
          {item.baseline && <span className="ml-2 text-xs text-muted-foreground">{item.baseline}</span>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className={cn("text-sm font-medium", textColorClass)}>{valueString}</span>
          {/* Simple visual bar, matching the example's style */}
          <div className="h-2 w-full sm:w-16 rounded-full bg-gray-200">
            <div
              className={cn("h-2 rounded-full", colorClass)}
              // Use absolute percentage for width, max 100
              style={{ width: `${Math.min(Math.abs(item.value.percentage), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Original rendering logic for when 'data' is provided
  if (data && data.length > 0) {
    return (
      <div className="rounded-lg border bg-background p-4 w-full max-w-xl mx-auto">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-lg">{title}</span>
          {tag && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 sm:mt-0">
              {tag}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}
        <div className="space-y-4">
          {data.map((category, index) => (
            <div key={category.title} className={index < data.length - 1 ? 'border-b pb-3 mb-3' : ''}>
              <div className="text-sm font-medium mb-2">{category.title}</div>
              <div className="space-y-3 sm:space-y-2">
                {category.items.map(item => renderProgressBar(item, category.isSideEffectCategory))}
              </div>
            </div>
          ))}
          {footer && (
            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground space-y-2">
              <ClinicalStudyCitationDisplay citation={footer.sourceCitation} />
              <div className="flex justify-between">
                {footer.lastUpdated && <span>{footer.lastUpdated}</span>}
                {footer.nnhDescription && (
                  <div className="mt-1">
                    <span>{footer.nnhDescription}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rendering logic for when data is fetched via getGroundedAnswerAction
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background p-4 w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading information for {title}...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-lg border bg-destructive/10 p-4 w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[200px]">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Error</p>
        <p className="text-xs text-destructive-foreground text-center">{fetchError}</p>
      </div>
    );
  }

  if (fetchedInfo) {
    return (
      <div className="rounded-lg border bg-background p-4 w-full max-w-xl mx-auto">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-lg">{title}</span>
          {tag && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 sm:mt-0">
              {tag}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}
        
        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
          <p>{fetchedInfo.answer}</p>
        </div>

        {fetchedInfo.citations && fetchedInfo.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sources</h4>
            <ul className="space-y-1 list-disc list-inside">
              {fetchedInfo.citations.map((citation, idx) => (
                <li key={idx} className="text-xs">
                  <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {citation.title || citation.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
         {fetchedInfo.renderedContent && (
            <div className="mt-4 pt-3 border-t">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Related Searches</h4>
                <div dangerouslySetInnerHTML={{ __html: fetchedInfo.renderedContent }} />
            </div>
        )}
      </div>
    );
  }
  
  // Fallback if no data, not loading, no error, and no fetched info (e.g. title was not provided initially)
  return (
    <div className="rounded-lg border bg-background p-4 w-full max-w-xl mx-auto">
      <p className="text-sm text-muted-foreground">No outcome data available for &ldquo;{title}&rdquo;.</p>
    </div>
  );
} 