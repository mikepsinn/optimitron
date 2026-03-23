import { BrutalCard } from "@/components/ui/brutal-card";

interface SavingsImpactProps {
  annualSavings: string;
  savingsComparison: string;
  wishoniaQuote: string;
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BrutalCard bgColor="pink" shadowSize={8} padding="lg">
          <div className="text-4xl font-black text-brutal-pink-foreground sm:text-5xl">
            {annualSavings}
          </div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-background">
            Annual Savings
          </div>
          <p className="mt-4 text-sm font-bold leading-relaxed text-muted-foreground">
            {savingsComparison}
          </p>
        </BrutalCard>
        <BrutalCard bgColor="foreground" shadowSize={8} padding="lg">
          <p className="text-lg font-bold italic leading-relaxed text-background">
            &ldquo;{wishoniaQuote}&rdquo;
          </p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-brutal-pink">
            — Wishonia
          </p>
        </BrutalCard>
      </div>
    </section>
  );
}
