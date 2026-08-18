import { BrutalCard } from "@/components/ui/brutal-card";

export interface StatItem {
  name: string;
  emoji: string;
  value: string | number;
  description: string;
  comparison?: string;
  source?: string;
  sourceUrl?: string;
}

interface SupplementaryStatCardsProps {
  title: string;
  subtitle?: string;
  items: StatItem[];
  columns?: 2 | 3;
}

const columnClasses: Record<2 | 3, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

/**
 * A generic grid of stat cards for any array with name/emoji/value/description.
 * Used across agency detail pages, landing sections, and comparison views.
 */
export function SupplementaryStatCards({
  title,
  subtitle,
  items,
  columns = 3,
}: SupplementaryStatCardsProps) {
  return (
    <section>
      <div className="mb-6">
        <h3 className="text-2xl sm:text-3xl font-black uppercase text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm font-bold text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`grid ${columnClasses[columns]} gap-6`}>
        {items.map((item) => (
          <BrutalCard key={item.name} bgColor="default" shadowSize={8} padding="md" hover>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl" role="img" aria-hidden="true">
                {item.emoji}
              </span>
              <h4 className="text-sm font-black uppercase text-foreground leading-tight">
                {item.name}
              </h4>
            </div>

            <p className="text-3xl font-black text-foreground mb-2">
              {item.value}
            </p>

            <p className="text-sm font-bold text-foreground leading-relaxed">
              {item.description}
            </p>

            {item.comparison && (
              <p className="text-xs font-bold text-muted-foreground italic mt-2">
                {item.comparison}
              </p>
            )}

            {item.source && (
              <p className="text-[10px] font-bold text-muted-foreground mt-3">
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-background transition-colors"
                  >
                    Source: {item.source} ↗
                  </a>
                ) : (
                  <>Source: {item.source}</>
                )}
              </p>
            )}
          </BrutalCard>
        ))}
      </div>
    </section>
  );
}
