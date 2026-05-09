import { ARCADE_LABELS } from "@/lib/messaging";

interface ArcadeTagProps {
  children: React.ReactNode;
  /** Bottom margin — defaults to mb-2 */
  className?: string;
}

/**
 * Subtitle tag for page headers — eyebrow text above a heading.
 *
 * Treaty migration 2026-05-08: dropped the Press Start 2P pixel font
 * and brutal-pink color. Renders as a quiet small-caps line in
 * muted-foreground. Component + ARCADE_LABELS dictionary kept so
 * consumers don't need updates; the visual is now treaty-style
 * across all surfaces.
 *
 * Usage:
 *   <ArcadeTag>Boss Fight</ArcadeTag>
 *   <ArcadeTag>{ARCADE_LABELS.playerStats}</ArcadeTag>
 */
export function ArcadeTag({ children, className = "mb-2" }: ArcadeTagProps) {
  return (
    <p
      className={`text-xs font-black uppercase tracking-[0.18em] text-muted-foreground ${className}`}
    >
      {children}
    </p>
  );
}
