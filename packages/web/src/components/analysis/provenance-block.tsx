import type { ExplorerPrecomputeIndex, ExplorerSource } from "@/lib/analysis-explorer-types";

interface ProvenanceBlockProps {
  generatedAt: string;
  sources: ExplorerSource[];
  title?: string;
  precomputeIndex?: ExplorerPrecomputeIndex;
}

export function ProvenanceBlock({
  generatedAt,
  sources,
  title = "Data Freshness & Provenance",
  precomputeIndex,
}: ProvenanceBlockProps) {
  return (
    <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-sm font-black uppercase text-black mb-3">{title}</h2>
      <p className="text-xs font-bold text-black/50 mb-3">
        Explorer payload generated {new Date(generatedAt).toLocaleString()}.
      </p>
      <ul className="space-y-2">
        {sources.map(source => (
          <li key={source.id} className="border border-black bg-muted px-3 py-2">
            <div className="text-xs font-black text-black uppercase">{source.label}</div>
            <div className="text-xs text-black/60">{source.provenance}</div>
            <div className="text-xs text-black/50">Generated {new Date(source.generatedAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
      {precomputeIndex && (
        <div className="mt-4 border border-black bg-brutal-yellow/20 px-3 py-2">
          <div className="text-xs font-black uppercase text-black">Precompute Cache Index</div>
          <div className="text-xs text-black/70">Key: {precomputeIndex.cacheKey}</div>
          <div className="text-xs text-black/70">
            {precomputeIndex.outcomeCount} outcomes • {precomputeIndex.predictorCount} predictors • {precomputeIndex.pairCount} pairs • {precomputeIndex.subjectCount} subjects
          </div>
        </div>
      )}
    </section>
  );
}
