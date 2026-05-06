import Link from "next/link";
import { getRepresentedLifeStatusLabel } from "@/lib/represented-life-status";
import { ROUTES } from "@/lib/routes";
import type { RepresentedPersonCard } from "@/lib/represented-people.server";

interface PersonFaceTileProps {
  index: number;
  person: RepresentedPersonCard;
}

export function PersonFaceTile({ person }: PersonFaceTileProps) {
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
      aria-label={`${person.displayName} - ${getRepresentedLifeStatusLabel(person.lifeStatus)}`}
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
        <div className="flex h-full w-full items-center justify-center border border-border bg-background text-5xl font-black uppercase text-foreground">
          {initials}
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex translate-y-full flex-col justify-end gap-1 bg-foreground/90 p-3 text-background opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]">
          {getRepresentedLifeStatusLabel(person.lifeStatus)}
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
            &ldquo;{person.publicComment}&rdquo;
          </p>
        ) : null}
        <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] opacity-70">
          Added by {person.representedBy}
        </p>
      </div>
    </Wrapper>
  );
}
