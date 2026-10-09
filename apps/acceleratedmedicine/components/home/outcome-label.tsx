import React from 'react';

// Copied from the decentralized-fda prototype (apps/web/components/OutcomeLabel.tsx), with one source line in place
// of its citation footer.
import { cn } from "@optimitron/neobrutalist-ui/cn";

export interface OutcomeValue {
  percentage?: number | null;
  absolute?: string; // e.g., "-69 mg/dL"
  nnh?: number;
  kind?: 'change' | 'frequency';
}

export interface OutcomeItem {
  name: string;
  baseline?: string; // e.g., "(baseline: 160 mg/dL)"
  value: OutcomeValue;
  isPositive?: boolean; // Green if true, Red if false, Amber if undefined (for side effects)
  source?: { label: string; href: string }; // Set when the value is taken from a cited source, not estimated
  // Each trial arm's value, drawn as a pair of bars: points of decline, or the share of patients with a side effect.
  arms?: { treatment: number; placebo: number; unit: string };
}

export interface OutcomeCategory {
  title: string;
  items: OutcomeItem[];
  isSideEffectCategory?: boolean; // To apply specific styling/logic for side effects
  description?: string;
  emptyText?: string;
}

export interface OutcomeLabelProps {
  title: string;
  subtitle?: string; // e.g., "Lipid-lowering agent"
  tag?: string; // Optional tag, e.g., "Drug Class"
  data: OutcomeCategory[];
  className?: string;
}

// The source most values cite. The label names it once at the bottom, and only values citing another source
// name theirs.
function sharedSource(data: OutcomeCategory[]) {
  const counts = new Map<string, { source: NonNullable<OutcomeItem['source']>; count: number }>();
  for (const item of data.flatMap(category => category.items)) {
    if (!item.source) continue;
    counts.set(item.source.href, { source: item.source, count: (counts.get(item.source.href)?.count ?? 0) + 1 });
  }
  const [most] = [...counts.values()].sort((a, b) => b.count - a.count);
  return most && { ...most.source, others: counts.size > 1 };
}

// The treatment's bar above placebo's, each with its value. `max` is the longest bar's value: the larger arm for a
// decline, and the largest side effect for side effects, so their bars share one scale.
function ArmBars({ treatmentName, arms, max }: { treatmentName: string; arms: NonNullable<OutcomeItem['arms']>; max: number }) {
  const format = (value: number) => (arms.unit === '%' ? `${value}%` : `${value} ${arms.unit}`);
  const rows = [
    { label: treatmentName, value: arms.treatment, bar: 'bg-primary', text: 'font-medium text-foreground' },
    { label: 'Placebo', value: arms.placebo, bar: 'bg-slate-300', text: 'text-muted-foreground' },
  ];
  return (
    <div className="mt-1.5 space-y-1">
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-2 text-xs">
          <span className="truncate text-muted-foreground">{row.label}</span>
          <span aria-hidden="true" className="h-2.5">
            <span className={cn('block h-full rounded-r-sm', row.bar)} style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className={cn('tabular-nums', row.text)}>{format(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function OutcomeLabel({ title, subtitle, tag, data = [], className }: OutcomeLabelProps) {
  const shared = sharedSource(data);
  const renderItem = (item: OutcomeItem, category: OutcomeCategory) => {
    const isSideEffect = Boolean(category.isSideEffectCategory);
    const textColorClass = isSideEffect
        ? 'text-red-700 dark:text-red-400' // Side effects usually shown in red/amber text
        : item.isPositive === true
          ? 'text-green-700 dark:text-green-400'
          : item.isPositive === false
            ? 'text-red-700 dark:text-red-400'
            : 'text-foreground';

    const percentage = item.value.percentage;
    const hasPercentage = percentage != null && Number.isFinite(percentage);
    // Without a percentage, an absolute change (e.g. "-0.78 pg/mL compared with placebo") is the value itself.
    const absoluteOnly = !hasPercentage && Boolean(item.value.absolute);
    const valueString = hasPercentage
      ? `${percentage > 0 && item.value.kind !== 'frequency' ? '+' : ''}${percentage}%`
      : absoluteOnly ? item.value.absolute : 'Not provided';

    // A side effect's bars show both arms' shares, so the share is not repeated beside its name.
    const showValue = !(item.arms && item.value.kind === 'frequency');
    const max = item.arms && item.value.kind === 'frequency'
      ? Math.max(...category.items.map(other => other.arms?.treatment ?? 0), ...category.items.map(other => other.arms?.placebo ?? 0))
      : item.arms && Math.max(item.arms.treatment, item.arms.placebo);

    return (
      <div key={item.name}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <span className="text-sm">{item.name}</span>
            {item.baseline && <span className="mt-1 block text-xs text-muted-foreground">{item.baseline}</span>}
            {item.source && item.source.href !== shared?.href && (
              <span className="mt-1 block text-xs">
                <a href={item.source.href} target="_blank" rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline">
                  Source: {item.source.label}<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            )}
          </div>
          {showValue && (
            <div className="text-sm sm:max-w-[48%] sm:text-right">
              <span className={cn("font-medium tabular-nums", hasPercentage || absoluteOnly ? textColorClass : "text-muted-foreground")}>{valueString}</span>
              {item.value.absolute && !absoluteOnly && <span className="ml-1 text-muted-foreground">({item.value.absolute})</span>}
              {item.value.nnh != null && <span className="ml-1 text-muted-foreground">(NNH: {item.value.nnh})</span>}
            </div>
          )}
        </div>
        {item.arms && max ? <ArmBars treatmentName={title || 'Treatment'} arms={item.arms} max={max} /> : null}
      </div>
    );
  };

  return (
    // Using border and bg-background to mimic the style in OutcomeLabelsSection
    <div className={cn("rounded-lg border bg-background p-4 w-full max-w-xl", className)}>
       <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <span className="font-semibold text-lg">{title}</span>
         {tag && (
           <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 sm:mt-0">
             {tag}
           </span>
         )}
       </div>
       {subtitle && <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>}

      <div className="space-y-4">
        {data.map((category, index) => (
          <div key={category.title} className={index < data.length - 1 ? 'border-b pb-3 mb-3' : ''}>
            <div className="text-sm font-medium mb-2">{category.title}</div>
            {category.description && <p className="mb-3 text-xs text-muted-foreground">{category.description}</p>}
            {!category.items.length && <p className="text-sm text-muted-foreground">{category.emptyText ?? "No estimates available."}</p>}
            <div className="space-y-3 sm:space-y-2">
              {category.items.map(item => renderItem(item, category))}
            </div>
          </div>
        ))}
      </div>
      {shared && (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          Source:{' '}
          <a href={shared.href} target="_blank" rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline">
            {shared.label}<span className="sr-only"> (opens in a new tab)</span>
          </a>
          {shared.others && ', unless noted'}
        </p>
      )}
    </div>
  );
}
