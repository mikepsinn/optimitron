import type { ReactNode } from "react"

/** A centered section title with an optional lead, for pages in the Accelerated Medicine look. */
export function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 id={id} className="text-3xl font-bold tracking-tighter sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-muted-foreground md:text-lg">{children}</p>}
    </div>
  )
}
