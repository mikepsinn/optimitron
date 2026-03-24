interface AgencyStampHeroProps {
  agencyName: string;
  dName: string;
  tagline: string;
}

export function AgencyStampHero({
  agencyName,
  dName,
  tagline,
}: AgencyStampHeroProps) {
  return (
    <section className="mb-16">
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center gap-4">
          <span className="inline-block border-4 border-brutal-red bg-brutal-red px-4 py-1 text-sm font-black uppercase tracking-[0.15em] text-foreground -rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Deprecated
          </span>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
            {dName}
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          {agencyName}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-muted-foreground italic">
          &ldquo;{tagline}&rdquo;
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brutal-pink">
          — Wishonia, Planetary Systems Engineer
        </p>
      </div>
    </section>
  );
}
