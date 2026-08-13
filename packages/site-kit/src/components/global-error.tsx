"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export function GlobalError({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="m-0 font-sans">
        <main className="flex min-h-screen items-center justify-center bg-brutal-beige p-4">
          <section className="w-full max-w-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-12">
            <p className="mb-4 text-7xl font-black">500</p>
            <h1 className="mb-4 text-4xl font-black uppercase">Something broke</h1>
            <p className="mb-8 text-lg">
              The error was reported. Try the request again. If it still fails, contact us and include what you were
              trying to do.
            </p>
            <button
              type="button"
              onClick={reset}
              className="border-4 border-black bg-brutal-pink px-8 py-4 text-lg font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}

export default GlobalError
