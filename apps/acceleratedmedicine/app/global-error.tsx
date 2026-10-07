"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { inter } from "@/lib/fonts"
import { SITE } from "@/lib/site-settings"
import "./globals.css"

/** Replaces the root layout when it fails, so it brings its own <html>, <body>, font and colors. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <main className="accelerated-medicine-theme flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
          <section className="w-full max-w-xl rounded-lg border bg-card p-8 text-center shadow-sm md:p-12">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Something broke</h1>
            <p className="mt-4 text-muted-foreground">
              The error was reported. Try the request again. If it still fails, email{" "}
              <a className="font-medium text-primary hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
              and include what you were trying to do.
            </p>
            <button type="button" onClick={reset}
              className="mt-8 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
