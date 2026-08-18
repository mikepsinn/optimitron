import type { OptimizationMetric } from "@optimitron/data/datasets/wishonia-agencies";
import { X, Check } from "lucide-react";

type AccentColor = "pink" | "cyan" | "yellow" | "green";

interface MetricsComparisonProps {
  deprecatedMetrics: OptimizationMetric[];
  optimalMetrics: OptimizationMetric[];
  accentColor: AccentColor;
}

function MetricItem({
  metric,
  icon,
}: {
  metric: OptimizationMetric;
  icon: "deprecated" | "optimal";
}) {
  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {icon === "deprecated" ? (
            <X className="h-5 w-5 text-brutal-red" strokeWidth={3} />
          ) : (
            <Check className="h-5 w-5 text-brutal-green" strokeWidth={3} />
          )}
        </div>
        <div>
          <div className="text-sm font-black uppercase tracking-wide">
            {metric.metric}
          </div>
          <p className="mt-1 text-xs font-bold text-muted-foreground leading-relaxed">
            {metric.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MetricsComparison({
  deprecatedMetrics,
  optimalMetrics,
}: MetricsComparisonProps) {
  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        What They Optimize For
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border-y border-foreground/30 py-2">
          <div className="py-3 text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Earth Agency Optimizes For
          </div>
          <div className="divide-y divide-foreground/20">
            {deprecatedMetrics.map((m) => (
              <MetricItem key={m.metric} metric={m} icon="deprecated" />
            ))}
          </div>
        </div>
        <div className="border-y border-foreground/30 py-2">
          <div className="py-3 text-xs font-black uppercase tracking-[0.15em] text-foreground">
            Wishonia Optimizes For
          </div>
          <div className="divide-y divide-foreground/20">
            {optimalMetrics.map((m) => (
              <MetricItem key={m.metric} metric={m} icon="optimal" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
