import type { IronicLaw } from "@optimitron/data";
import { BrutalCard } from "@/components/ui/brutal-card";

interface IronicLawCalloutProps {
  law: IronicLaw;
}

/**
 * Single BrutalCard (yellow bg) showing a law named the opposite of its effect.
 * Two columns: what it promised vs what actually happened.
 * Key metric in large text at bottom.
 */
export function IronicLawCallout({ law }: IronicLawCalloutProps) {
  return (
    <BrutalCard bgColor="yellow" shadowSize={8} padding="md" hover>
      {/* Heading */}
      <div className="mb-4">
        <h4 className="text-base font-black uppercase text-brutal-yellow-foreground leading-tight">
          {law.emoji} &ldquo;{law.name}&rdquo;
          <span className="text-sm font-bold text-brutal-yellow-foreground ml-2">
            ({law.year})
          </span>
        </h4>
      </div>

      {/* Two columns: promised vs happened */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-brutal-yellow-foreground tracking-widest">
            What It Promised
          </span>
          <p className="text-sm font-bold text-brutal-yellow-foreground mt-1 leading-relaxed">
            {law.whatItPromised}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase text-brutal-red tracking-widest">
            What Actually Happened
          </span>
          <p className="text-sm font-bold text-brutal-red mt-1 leading-relaxed">
            {law.whatActuallyHappened}
          </p>
        </div>
      </div>

      {/* Key metric */}
      <div className="border-t-4 border-primary pt-3 mt-3">
        <p className="text-xl font-black text-brutal-yellow-foreground text-center">
          {law.keyMetric}
        </p>
      </div>

      {/* Source */}
      <div className="mt-3 text-center">
        <a
          href={law.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-brutal-yellow-foreground hover:text-brutal-pink transition-colors"
        >
          {law.source} ↗
        </a>
      </div>
    </BrutalCard>
  );
}
