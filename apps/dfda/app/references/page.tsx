import Layout from "@/components/layout";
import { ReferencesList } from "./references-list";
import { ReferencesListSkeleton } from "./references-list";
import { Suspense } from "react";
import type { Metadata } from 'next';
import { getSiteConfigForVariant } from '@/lib/site-config';
import { VARIANTS } from '@/lib/site-variant-types';

export function generateMetadata(): Metadata {
  const canonicalBaseUrl = getSiteConfigForVariant(VARIANTS.WAR_ON_DISEASE).baseUrl;

  return {
    title: "References - Source Citations and Quotes",
    description: "Comprehensive collection of source quotes, citations, and references supporting all claims made throughout the War on Disease documentation.",
    alternates: {
      canonical: `${canonicalBaseUrl}/references`,
    },
  };
}

export default function ReferencesPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">References & Sources</h1>
        <p className="text-muted-foreground mb-6">
          Comprehensive collection of source quotes, citations, and references supporting all claims made throughout the documentation.
        </p>
        {/* Use Suspense for better loading UX while data fetches */}
        <Suspense fallback={<ReferencesListSkeleton />}>
          <ReferencesList />
        </Suspense>
      </div>
    </Layout>
  );
}
