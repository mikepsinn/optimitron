"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/** Reports each visit to a missing page to Sentry, with the address and the page that linked to it. */
export function Sentry404Reporter() {
  useEffect(() => {
    const error = new Error(`404 Not Found: ${window.location.pathname}`)
    error.name = "NotFoundError"

    Sentry.captureException(error, {
      level: "error",
      tags: { status_code: "404", source: "not_found_page" },
      extra: {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || undefined,
      },
    })
  }, [])

  return null
}
