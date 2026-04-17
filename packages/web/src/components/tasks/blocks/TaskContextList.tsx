import { BrutalCard } from "@/components/ui/brutal-card";
import type { TaskContext } from "@/lib/tasks/task-context";
import { renderTemplate } from "@/lib/tasks/render-template";

interface TaskContextListProps {
  context: TaskContext;
  tokens?: Record<string, string | number | null | undefined>;
}

export function TaskContextList({ context, tokens }: TaskContextListProps) {
  const comparisons = context.contextComparisons;
  if (!comparisons || comparisons.length === 0) return null;
  const interpolate = (text: string) => (tokens ? renderTemplate(text, tokens) : text);

  return (
    <BrutalCard bgColor="background" padding="lg">
      <div className="space-y-6">
        {comparisons.map((group) => (
          <div key={group.heading} className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
              {group.heading}
            </p>
            <ul className="space-y-1 text-sm font-bold">
              {group.items.map((item) => (
                <li
                  key={`${group.heading}-${item.label}`}
                  className={`flex items-baseline justify-between gap-4 border-b-2 border-foreground/10 pb-1 ${
                    item.highlight ? "text-brutal-red" : ""
                  }`}
                >
                  <span>· {interpolate(item.label)}</span>
                  <span className="font-mono">
                    {interpolate(item.value)}
                    {item.highlight ? " ← you are" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </BrutalCard>
  );
}
