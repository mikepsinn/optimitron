import { BrutalCard } from "@/components/ui/brutal-card";
import type { EarthAgency } from "@optimitron/data/datasets/earth-agencies";
import type { AgencyGrade } from "@optimitron/data/datasets/agency-performance";

type AccentColor = "pink" | "cyan" | "yellow" | "green";

const gradeColors: Record<AgencyGrade, string> = {
  A: "bg-background text-foreground",
  B: "bg-background text-foreground",
  C: "bg-background text-foreground",
  D: "bg-background text-foreground",
  F: "bg-brutal-red text-brutal-red-foreground",
};

interface EarthAgencyReportCardProps {
  earthAgencies: EarthAgency[];
  accentColor: AccentColor;
}

function GradeBadge({ grade }: { grade: AgencyGrade }) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center border-4 border-primary text-2xl font-black ${gradeColors[grade]}`}
    >
      {grade}
    </span>
  );
}

function SingleAgencyCard({ agency }: { agency: EarthAgency }) {
  const perf = agency.performance!;
  return (
    <BrutalCard bgColor="foreground" shadowSize={8} padding="lg">
      <div className="flex items-start gap-6">
        <GradeBadge grade={perf.grade} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{agency.emoji}</span>
            <h3 className="text-xl font-black uppercase text-background">
              {agency.name}
            </h3>
          </div>
          <p className="mt-2 text-sm font-bold leading-relaxed text-background/80">
            {perf.gradeRationale}
          </p>
          <p className="mt-4 text-sm font-bold italic text-background leading-relaxed">
            &ldquo;{perf.wishoniaQuote}&rdquo;
          </p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-foreground">
            — Wishonia
          </p>
        </div>
      </div>
    </BrutalCard>
  );
}

function MultiAgencyCard({ agencies }: { agencies: EarthAgency[] }) {
  return (
    <BrutalCard bgColor="foreground" shadowSize={8} padding="lg">
      <div className="mb-4 text-xs font-black uppercase tracking-[0.15em] text-background/80">
        Replaces {agencies.length} agencies
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {agencies.map((ea) => (
          <div
            key={ea.id}
            className="border-4 border-primary bg-background p-3 text-center"
          >
            <GradeBadge grade={ea.performance!.grade} />
            <div className="mt-2 text-xs font-black uppercase text-foreground">
              {ea.emoji} {ea.name}
            </div>
          </div>
        ))}
      </div>
      {/* Show the primary agency's rationale */}
      <p className="text-sm font-bold italic text-background leading-relaxed">
        &ldquo;{agencies[0]!.performance!.wishoniaQuote}&rdquo;
      </p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-foreground">
        — Wishonia
      </p>
    </BrutalCard>
  );
}

export function EarthAgencyReportCard({
  earthAgencies,
}: EarthAgencyReportCardProps) {
  if (earthAgencies.length === 0) return null;

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        Report Card
      </h2>
      {earthAgencies.length === 1 ? (
        <SingleAgencyCard agency={earthAgencies[0]!} />
      ) : (
        <MultiAgencyCard agencies={earthAgencies} />
      )}
    </section>
  );
}
