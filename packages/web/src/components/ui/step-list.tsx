import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StepListItem {
  step: ReactNode;
  title: ReactNode;
  description: ReactNode;
}

interface StepListProps {
  items: StepListItem[];
  className?: string;
}

export function StepList({ items, className }: StepListProps) {
  return (
    <ol className={cn("divide-y divide-foreground/20 border-y border-foreground/30", className)}>
      {items.map((item, index) => (
        <li key={index} className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)]">
          <div className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
            {item.step}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-foreground">
              {item.title}
            </h3>
            <p className="mt-1 text-sm font-bold leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
