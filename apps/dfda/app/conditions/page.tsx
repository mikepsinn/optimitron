import Layout from "@/components/layout";
import { ConditionsList } from "./conditions-list";
import { ConditionsListSkeleton } from "./conditions-list";
import { Suspense } from "react";
import type { Metadata } from 'next';
import { getPrimaryDomain } from '@/lib/site-config';

export function generateMetadata(): Metadata {
  return {
    title: "Browse Medical Conditions",
    description: "Browse medical conditions and find trials. Explore clinical trials for various health conditions.",
    alternates: {
      canonical: `${getPrimaryDomain()}/conditions`,
    },
  };
}

export default function ConditionsPage() {
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Find Treatment Rankings by Condition</h1>
        <p className="text-muted-foreground mb-6">
          Select a condition below to view available clinical trials.
        </p>
        {/* Use Suspense for better loading UX while data fetches */}
        <Suspense fallback={<ConditionsListSkeleton />}>
          <ConditionsList />
        </Suspense>
      </div>
    </Layout>
  );
}
