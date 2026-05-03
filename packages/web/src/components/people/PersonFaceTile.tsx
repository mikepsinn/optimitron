import Link from "next/link";
import { PersonLifeStatus } from "@optimitron/db/enums";
import { ROUTES } from "@/lib/routes";
import type { RepresentedPersonCard } from "@/lib/represented-people.server";

interface PersonFaceTileProps {
  person: RepresentedPersonCard;
  /**
   * Tile index — used to rotate brutal-* background colors on the
   * avatar-fallback variant so the wall-of-faces grid feels varied even
   * before any actual photos are uploaded.
   */
  index: number;
}

const FALLBACK_PALETTE = [
  "bg-brutal-pink text-brutal-pink-foreground",
  "bg-brutal-cyan text-brutal-cyan-foreground",
  "bg-brutal-yellow text-brutal-yellow-foreground",
  "bg-brutal-red text-brutal-red-foreground",
  "bg-brutal-green text-brutal-green-foreground",
] as const;

function lifeStatusBadge(status: PersonLifeStatus): string {
  if (status === PersonLifeStatus.DECEASED) return "Memorial signature 👻";
  if (status === PersonLifeStatus.LIVING) return "Represented human";
  return "Status unknown";
}

/**
 * Single tile in the wall of faces. Square aspect, photo-first.
 * Text appears on hover (desktop) or tap focus (mobile, via the same hover
 * styles when keyboard-focused). PRD Feature 2: *"A wall of faces. Photos
 * in a grid. No text until you hover/tap. Just faces. Let the scale of it
 * hit first."*
 */
export function PersonFaceTile({ person, index }: PersonFaceTileProps) {
  const fallbackPalette = FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]!;
  const initials =
    person.displayName
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const isLinked = Boolean(person.href) && person.href !== ROUTES.people;
  const Wrapper: React.ElementType = isLinked ? Link : "article";
  const wrapperProps = isLinked ? { href: person.href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      aria-label={`${person.displayName} — ${lifeStatusBadge(person.lifeStatus)}`}
      className="group relative block aspect-square overflow-hidden border border-border bg-muted text-card-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
    >
      {person.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={person.displayName}
          className="h-full w-full object-cover"
          src={person.image}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center text-5xl font-black uppercase ${fallbackPalette}`}
        >
          {initials}
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex translate-y-full flex-col justify-end gap-1 bg-foreground/90 p-3 text-background opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]">
          {lifeStatusBadge(person.lifeStatus)}
        </p>
        <p className="line-clamp-2 text-base font-black uppercase leading-tight">
          {person.displayName}
        </p>
        {person.conditionName ? (
          <p className="line-clamp-1 text-xs font-bold opacity-80">
            {person.conditionName}
          </p>
        ) : null}
        {person.publicComment ? (
          <p className="line-clamp-3 text-xs font-bold leading-snug">
            “{person.publicComment}”
          </p>
        ) : null}
        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] opacity-70">
          Filed by {person.representedBy}
        </p>
      </div>
    </Wrapper>
  );
}
