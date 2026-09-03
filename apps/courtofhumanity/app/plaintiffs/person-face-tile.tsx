import { PersonLifeStatus } from "@optimitron/db/enums"
import { optimitronUrl } from "@/lib/optimitron-links"
import { getRepresentedLifeStatusLabel } from "@/lib/represented-life-status"
import type { RepresentedPersonCard } from "@/lib/represented-people.server"

interface PersonFaceTileProps {
  person: RepresentedPersonCard
}

/**
 * One face in the wall of plaintiffs.
 *
 * `person.href` is `/people/{handle-or-id}`, a people-directory route that
 * stays on optimitron.com, so the tile links across domains rather than to a
 * path this app does not serve.
 */
export function PersonFaceTile({ person }: PersonFaceTileProps) {
  const initials =
    person.displayName
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"

  return (
    <a
      aria-label={`${person.displayName} - ${getRepresentedLifeStatusLabel(person.lifeStatus)}`}
      className="group relative block aspect-square overflow-hidden border border-border bg-muted text-card-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
      href={optimitronUrl(person.href)}
      rel="noopener noreferrer"
      target="_blank"
    >
      {person.image ? (
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
        {person.lifeStatus === PersonLifeStatus.DECEASED ? (
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]">
            {getRepresentedLifeStatusLabel(person.lifeStatus)}
          </p>
        ) : null}
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
    </a>
  )
}
