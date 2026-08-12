import Layout from "@/components/layout";
import { TreatmentsList } from "./treatments-list";
import { TreatmentsListSkeleton } from "./treatments-list";
import { Suspense } from "react";
import type { Metadata } from 'next';
import { getPrimaryDomain } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return {
    title: "Browse Medical Treatments",
    description: "Browse medical treatments and interventions. Explore clinical trial data for various therapeutic options.",
    alternates: {
      canonical: `${getPrimaryDomain()}/treatments`,
    },
  };
}

export default function TreatmentsPage() {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Browse Treatments</h1>
        <p className="text-muted-foreground mb-6">
          Explore treatments and interventions across multiple conditions. View comprehensive clinical trial data and effectiveness metrics.
        </p>
        {/* Use Suspense for better loading UX while data fetches */}
        <Suspense fallback={<TreatmentsListSkeleton />}>
          <TreatmentsList />
        </Suspense>
      </div>
    </Layout>
  );
}
