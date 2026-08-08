"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export function Sentry404Reporter() {
  useEffect(() => {
    const url = window.location.href
    const error = new Error(`404 Not Found: ${window.location.pathname}`)
    error.name = "NotFoundError"

    Sentry.captureException(error, {
      level: "error",
      tags: {
        status_code: "404",
        source: "not_found_page",
      },
      extra: {
        url,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || undefined,
      },
    })
  }, [])

  return null
}
