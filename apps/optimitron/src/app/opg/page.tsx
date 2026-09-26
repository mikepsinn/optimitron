"use client";

import { useState } from "react";
import Link from "next/link";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import { getPolicyPath } from "@/lib/routes";
import { policyDisplayName, policyEvidenceLabel } from "@/lib/policy-presentation";

export default function PoliciesPage() {
  const [category, setCategory] = useState("all");
  const policies = usPolicyAnalysis.policies.filter((policy) => category === "all" || policy.category === category);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">Policy evidence</h1>
      <p className="text-muted-foreground font-bold mb-6">
        Explore policy proposals for better health and higher incomes.
      </p>
      <label className="block text-sm font-bold mb-2" htmlFor="policy-category">Category</label>
      <select id="policy-category" value={category} onChange={(event) => setCategory(event.target.value)}
        className="border-4 border-primary bg-background px-3 py-2 font-bold mb-8 max-w-full">
        <option value="all">All categories</option>
        {[...new Set(usPolicyAnalysis.policies.map((policy) => policy.category))].map((value) => (
          <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
        ))}
      </select>
      <div className="space-y-5">
        {policies.map((policy) => (
          <article key={policy.name} className="border-4 border-primary p-5 sm:p-6">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">{policyEvidenceLabel(policy.evidenceKind)}</p>
            <h2 className="text-xl font-black mb-2">
              <Link className="underline" href={getPolicyPath(policy.name)}>{policyDisplayName(policy)}</Link>
            </h2>
            <p className="text-sm mb-4">{policy.description}</p>
            {policy.recommendedTarget && (
              <p className="text-sm mb-4"><strong>{policy.evidenceKind === "comparison" ? "Comparison:" : "Proposed change:"}</strong> {policy.recommendedTarget}</p>
            )}
            <Link className="font-bold underline text-sm" href={getPolicyPath(policy.name)}>View analysis →</Link>
          </article>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-8">
        <Link href="/obg" className="underline">Compare spending and outcomes.</Link>
      </p>
      <p className="text-xs text-muted-foreground mt-4">Generated: {usPolicyAnalysis.generatedAt.slice(0, 10)}</p>
    </div>
  );
}
