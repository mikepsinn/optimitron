import { AlertTriangle } from "lucide-react";

/**
 * Plain-language provenance notice for pages built from the static
 * medical-data snapshot (packages/data/src/datasets/medical-data). Most of its
 * effect sizes, effectiveness and safety scores were estimated by a language
 * model from trial registrations and literature, not measured, so every page
 * that shows them says so.
 */
export function AiEstimateNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex gap-3 border-4 border-foreground bg-yellow-200 p-4 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-bold">
        Most numbers on this page are AI-generated estimates from clinical trial
        records and published literature, not measured outcomes, and have not
        been verified. Use them as a starting point for questions, not as
        evidence or medical advice.
      </p>
    </div>
  );
}
