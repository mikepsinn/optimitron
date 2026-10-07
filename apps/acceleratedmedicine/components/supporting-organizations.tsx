import type { ListedOrganization } from "@/lib/support-store"

/** Approved organizations, each linked to its own website. */
export function SupportingOrganizations({ organizations, showState = true }: { organizations: ListedOrganization[]; showState?: boolean }) {
  return (
    <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4">
      {organizations.map(organization => (
        <li key={organization.organization}
          className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 shadow-sm sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]">
          {organization.logoUrl ? (
            // A plain img: logos live on the organizations' own hosts.
            <img src={organization.logoUrl} alt="" referrerPolicy="no-referrer" loading="lazy"
              className="h-12 w-12 shrink-0 rounded-md object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-lg font-semibold text-primary">
              {organization.organization.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <a href={organization.website} rel="noreferrer nofollow" target="_blank" className="font-semibold hover:text-primary hover:underline">
              {organization.organization}
            </a>
            {showState && <p className="text-sm text-muted-foreground">{organization.state}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
