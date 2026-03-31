import type { GovernmentLie } from "@optimitron/data";
import { BrutalCard } from "@/components/ui/brutal-card";

interface LieComparisonCardProps {
  lie: GovernmentLie;
}

/**
 * Two-column lie vs truth card. Red for the lie, cyan for the truth.
 * Bottom bar shows death/affected counts, source, and declassified badge.
 */
export function LieComparisonCard({ lie }: LieComparisonCardProps) {
  const yearsActive = lie.yearEnd
    ? `${lie.yearStart}–${lie.yearEnd} (${lie.yearEnd - lie.yearStart} years)`
    : `${lie.yearStart}–present`;

  return (
    <BrutalCard bgColor="default" shadowSize={8} padding="sm" hover>
      {/* Title */}
      <div className="px-2 pt-2 pb-3">
        <h4 className="text-sm font-black uppercase text-foreground">
          {lie.emoji} {lie.event}
        </h4>
        <p className="text-[10px] font-bold text-muted-foreground">
          Exposed: {lie.yearExposed}
        </p>
      </div>

      {/* Two-column lie vs truth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* THE LIE */}
        <div className="bg-brutal-red p-4 border-t-4 border-primary md:border-r-2">
          <span className="text-[10px] font-black uppercase text-brutal-red-foreground tracking-widest">
            The Lie
          </span>
          <p className="text-sm font-black text-brutal-red-foreground mt-2 leading-relaxed">
            &ldquo;{lie.theLie}&rdquo;
          </p>
          <p className="text-[10px] font-bold text-brutal-red-foreground mt-2">
            {yearsActive}
          </p>
        </div>

        {/* THE TRUTH */}
        <div className="bg-brutal-cyan text-brutal-cyan-foreground p-4 border-t-4 border-primary md:border-l-2 md:border-t-4">
          <span className="text-[10px] font-black uppercase tracking-widest">
            The Truth
          </span>
          <p className="text-sm font-bold mt-2 leading-relaxed">
            {lie.theTruth}
          </p>
          <p className="text-xs font-bold mt-2">
            {lie.harm}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t-4 border-primary bg-background">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-brutal-red">
            {lie.deathsOrAffected}
          </span>
          {lie.declassified && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brutal-yellow text-brutal-yellow-foreground border-2 border-primary">
              Declassified
            </span>
          )}
        </div>
        <a
          href={lie.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-muted-foreground hover:text-brutal-pink transition-colors"
        >
          {lie.source} ↗
        </a>
      </div>
    </BrutalCard>
  );
}
