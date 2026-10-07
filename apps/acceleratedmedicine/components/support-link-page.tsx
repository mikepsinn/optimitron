import { CheckCircle2, CircleAlert } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"

/** The page a confirmation or approval link opens: a bad link, a button to click, or the result. */
export function SupportLinkPage({
  status,
  title,
  children,
  action,
  buttonLabel,
}: {
  status: "invalid" | "pending" | "done"
  title: string
  children: ReactNode
  action?: () => Promise<void>
  buttonLabel?: string
}) {
  const Icon = status === "invalid" ? CircleAlert : CheckCircle2
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-xl py-8 md:py-16">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          {status !== "pending" && (
            <Icon aria-hidden="true" className={`mx-auto h-10 w-10 ${status === "invalid" ? "text-destructive" : "text-primary"}`} />
          )}
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
          {status === "pending" && action && (
            <form action={action} className="mt-6">
              <Button type="submit" size="lg">{buttonLabel}</Button>
            </form>
          )}
          {status === "invalid" && (
            <Button asChild size="lg" variant="outline" className="mt-6"><Link href="/support">Go to the support page</Link></Button>
          )}
          {status === "done" && (
            <Button asChild size="lg" variant="outline" className="mt-6"><Link href="/supporters">See who supports the initiative</Link></Button>
          )}
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}

export const invalidLinkText =
  "The link may be incomplete or copied wrong. Open it from the email again. If it still does not work, sign up again on the support page."
