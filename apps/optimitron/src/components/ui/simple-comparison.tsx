import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SimpleComparisonItem {
  label: ReactNode;
  value: ReactNode;
}

export interface SimpleComparisonColumn {
  title: ReactNode;
  items: SimpleComparisonItem[];
}

interface SimpleComparisonGridProps {
  columns: SimpleComparisonColumn[];
  className?: string;
}

export function SimpleComparisonGrid({
  columns,
  className,
}: SimpleComparisonGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-8 md:grid-cols-2", className)}>
      {columns.map((column, index) => (
        <section key={index} className="min-w-0">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-foreground">
            {column.title}
          </h3>
          <dl className="divide-y divide-foreground/20 border-y border-foreground/30">
            {column.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
              >
                <dt className="text-xs font-black uppercase text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-sm font-black text-foreground sm:text-right">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
