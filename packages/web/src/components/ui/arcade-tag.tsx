import { ARCADE_LABELS } from "@/lib/messaging";

interface ArcadeTagProps {
  children: React.ReactNode;
  /** Bottom margin — defaults to mb-2 */
  className?: string;
}

/**
 * Arcade-styled subtitle tag for page headers.
 * Renders in Press Start 2P pixel font, pink, uppercase.
 *
 * Usage:
 *   <ArcadeTag>Boss Fight</ArcadeTag>
 *   <ArcadeTag>{ARCADE_LABELS.playerStats}</ArcadeTag>
 */
export function ArcadeTag({ children, className = "mb-2" }: ArcadeTagProps) {
  return (
    <p
      className={`font-[family-name:var(--font-arcade)] text-sm font-black uppercase tracking-[0.2em] text-brutal-pink ${className}`}
    >
      {children}
    </p>
  );
}
