import { cn } from "@/lib/utils";
import { BrutalCard, type BrutalCardBgColor } from "@/components/ui/brutal-card";
import { RarityBadge, type Rarity } from "@/components/ui/rarity-badge";
import { StatBarGroup, type StatBarProps } from "@/components/ui/stat-bar";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import type { NavItem } from "@/lib/routes";

export interface ItemCardProps {
  /** Item name */
  name: string;
  /** Type icon (emoji) */
  icon: string;
  /** Rarity tier */
  rarity: Rarity;
  /** Short Wishonia-voice description */
  description: string;
  /** RPG stat bars */
  stats: Omit<StatBarProps, "className">[];
  /** What it costs the player */
  cost: string;
  /** Internal navigation link */
  link?: { item: NavItem; label: string };
  /** External link */
  externalLink?: { href: string; label: string };
  /** Whether the item is locked (Phase 2, not yet available) */
  locked?: boolean;
  /** Lock reason shown on overlay */
  lockReason?: string;
  /** Card background color */
  bgColor?: BrutalCardBgColor;
  className?: string;
}

/**
 * RPG item shop card for the Armory page.
 * Combines BrutalCard with rarity badge, stat bars, cost tag, and EQUIP button.
 */
export function ItemCard({
  name,
  icon,
  rarity,
  description,
  stats,
  cost,
  link,
  externalLink,
  locked = false,
  lockReason,
  bgColor = "default",
  className,
}: ItemCardProps) {
  return (
    <BrutalCard
      bgColor={bgColor}
      shadowSize={8}
      padding="md"
      hover={!locked}
      className={cn("relative flex flex-col", locked && "opacity-70", className)}
    >
      {/* Locked overlay */}
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-foreground/80 border-4 border-primary">
          <span className="font-pixel text-xs text-brutal-red uppercase tracking-wider">
            LOCKED
          </span>
          {lockReason && (
            <span className="mt-2 px-4 text-center text-xs font-bold text-background">
              {lockReason}
            </span>
          )}
        </div>
      )}

      {/* Header: icon + rarity */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl" role="img" aria-label={name}>
          {icon}
        </span>
        <RarityBadge rarity={rarity} />
      </div>

      {/* Item name */}
      <h3 className="font-black uppercase text-lg mb-2 tracking-tight">
        {name}
      </h3>

      {/* Description */}
      <p className="text-sm font-bold leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      {/* Stat bars */}
      <StatBarGroup stats={stats} className="mb-4" />

      {/* Footer: cost + equip button */}
      <div className="flex items-center justify-between border-t-2 border-primary pt-3 mt-auto">
        <span className="font-pixel text-[10px] uppercase">
          Cost: {cost}
        </span>

        {link && (
          <NavItemLink
            item={link.item}
            variant="custom"
            className="inline-flex items-center gap-1 font-pixel text-[10px] font-black uppercase underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {link.label} &rarr;
          </NavItemLink>
        )}
        {externalLink && (
          <a
            href={externalLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-pixel text-[10px] font-black uppercase underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {externalLink.label} &rarr;
          </a>
        )}
        {!link && !externalLink && !locked && (
          <span className="font-pixel text-[10px] uppercase">
            Coming Soon
          </span>
        )}
      </div>
    </BrutalCard>
  );
}
