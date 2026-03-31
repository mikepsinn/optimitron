import Link from "next/link";
import { CTA } from "@/lib/messaging";

const variants = {
  primary:
    "bg-brutal-pink text-brutal-pink-foreground",
  secondary:
    "bg-foreground text-background",
  outline:
    "bg-background text-foreground",
  yellow:
    "bg-brutal-yellow text-brutal-yellow-foreground",
  cyan:
    "bg-brutal-cyan text-brutal-cyan-foreground",
} as const;

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3.5 text-lg",
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
    "font-pixel",
    "font-black uppercase",
    "border-4 border-primary",
    "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    "hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
    "hover:translate-x-[-2px] hover:translate-y-[-2px]",
    "transition-all",
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
