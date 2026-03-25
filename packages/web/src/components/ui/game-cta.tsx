import Link from "next/link";
import { CTA } from "@/lib/messaging";

const variants = {
  primary:
    "bg-arcade-pink text-black neon-box-pink",
  secondary:
    "bg-arcade-green text-black neon-box-green",
  outline:
    "bg-background text-arcade-green border-arcade-green neon-box-green",
  yellow:
    "bg-arcade-yellow text-black neon-box-yellow",
  cyan:
    "bg-arcade-cyan text-black neon-box-cyan",
} as const;

const sizes = {
  sm: "px-4 py-2 text-[8px]",
  md: "px-6 py-3 text-[9px]",
  lg: "px-8 py-3.5 text-[10px]",
} as const;

interface GameCTAProps {
  /** Link destination */
  href: string;
  /** Visual style */
  variant?: keyof typeof variants;
  /** Button size */
  size?: keyof typeof sizes;
  /** Button text — defaults to "Play the Game" */
  children?: React.ReactNode;
  /** External link (opens in new tab) */
  external?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Shared arcade-styled CTA button.
 * Uses the pixel font, hard shadows, and lift-on-hover pattern.
 *
 * Usage:
 *   <GameCTA href="/prize" />                          → "Play the Game" pink button
 *   <GameCTA href="/scoreboard" variant="outline">High Scores</GameCTA>
 *   <GameCTA href="https://..." external>Read the Paper</GameCTA>
 */
export function GameCTA({
  href,
  variant = "primary",
  size = "md",
  children = CTA.playTheGame,
  external = false,
  className = "",
}: GameCTAProps) {
  const baseClasses = [
    "inline-flex items-center justify-center gap-2",
    "font-[family-name:var(--font-arcade)]",
    "font-black uppercase tracking-wider",
    "border-2",
    "hover:scale-105 active:scale-95",
    "transition-all duration-150",
    variants[variant],
    sizes[size],
    className,
  ].join(" ");

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={baseClasses}>
      {children}
    </Link>
  );
}
