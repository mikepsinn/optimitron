interface SavingsImpactProps {
  annualSavings: string;
  savingsComparison: string;
  wishoniaQuote: string;
  accentColor?: "pink" | "cyan" | "yellow" | "green";
}

export function SavingsImpact({
  annualSavings,
  savingsComparison,
  wishoniaQuote,
}: SavingsImpactProps) {
  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        The Savings
      </h2>
      <div className="grid grid-cols-1 gap-8 border-y border-foreground/30 py-6 md:grid-cols-2">
        <div>
          <div className="text-4xl font-black sm:text-5xl">
            {annualSavings}
          </div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.1em]">
            Annual Savings
          </div>
          <p className="mt-4 text-sm font-bold leading-relaxed opacity-80">
            {savingsComparison}
          </p>
        </div>
        <div className="border-l border-foreground/30 pl-4">
          <p className="text-lg font-bold italic leading-relaxed text-foreground">
            &ldquo;{wishoniaQuote}&rdquo;
          </p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
            — Wishonia
          </p>
        </div>
      </div>
    </section>
  );
}
