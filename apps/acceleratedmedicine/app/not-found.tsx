import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { Sentry404Reporter } from "@/components/sentry-404-reporter"

export default function NotFound() {
  return (
    <AcceleratedMedicinePage>
      <Sentry404Reporter />
      <section className="mx-auto max-w-2xl py-12 text-center md:py-20">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-xl">
          This address may be wrong, or the page may have moved. Return home to continue.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">Go home</Link>
        </Button>
      </section>
    </AcceleratedMedicinePage>
  )
}
