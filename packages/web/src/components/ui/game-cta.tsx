import Link from "next/link";
import { CTA } from "@/lib/messaging";
import { defaultButtonClassName } from "@/components/ui/default-button";

const variants = {
  primary: "",
  secondary: "",
  outline: "",
  yellow: "",
  cyan: "",
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
    defaultButtonClassName,
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
