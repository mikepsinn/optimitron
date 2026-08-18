import { cn } from "@/lib/utils";

export type Rarity = "legendary" | "epic" | "rare" | "uncommon";

export interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
}

const rarityStyles: Record<Rarity, { bg: string; text: string; label: string }> = {
  legendary: {
    bg: "bg-foreground",
    text: "text-background",
    label: "LEGENDARY",
  },
  epic: {
    bg: "bg-background",
    text: "text-foreground",
    label: "EPIC",
  },
  rare: {
    bg: "bg-background",
    text: "text-foreground",
    label: "RARE",
  },
  uncommon: {
    bg: "bg-foreground",
    text: "text-background",
    label: "UNCOMMON",
  },
};

/**
 * Pixel-font rarity badge for RPG item cards.
 *
 * Usage:
 *   <RarityBadge rarity="legendary" />
 */
export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const style = rarityStyles[rarity];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5",
        "font-pixel text-[10px] uppercase tracking-wider",
        "border-2 border-primary",
        style.bg,
        style.text,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
