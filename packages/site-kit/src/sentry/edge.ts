import * as Sentry from "@sentry/nextjs"

import { getSentrySampleRate } from "./sample-rate"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: getSentrySampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  sendDefaultPii: false,
})
