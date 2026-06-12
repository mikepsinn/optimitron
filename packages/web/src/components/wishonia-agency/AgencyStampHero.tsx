type CardColor = "pink" | "cyan" | "yellow" | "green";

const dNameColorClasses: Record<CardColor, string> = {
  pink: "text-foreground",
  cyan: "text-foreground",
  yellow: "text-foreground",
  green: "text-foreground",
};

interface AgencyStampHeroProps {
  agencyName: string;
  dName: string;
  tagline: string;
  cardColor?: CardColor;
}

export function AgencyStampHero({
  agencyName,
  dName,
  tagline,
  cardColor,
}: AgencyStampHeroProps) {
  return (
    <section className="mb-16">
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center gap-4">
          <span className="inline-block border border-foreground px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Deprecated
          </span>
          <span
            className={`text-sm font-black uppercase tracking-[0.2em] ${cardColor ? dNameColorClasses[cardColor] : "text-muted-foreground"}`}
          >
            {dName}
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          {agencyName}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-muted-foreground italic">
          &ldquo;{tagline}&rdquo;
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">
          — Wishonia, Planetary Systems Engineer
        </p>
      </div>
    </section>
  );
}
