import * as Sentry from "@sentry/nextjs"

// The site has no middleware or edge routes, so only the Node.js runtime needs Sentry.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
}

export const onRequestError = Sentry.captureRequestError
