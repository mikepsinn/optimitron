import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"
import { SITE_VARIANTS, DEFAULT_VARIANT } from "./site-variant-types"

export const env = createEnv({
  /**
   * Server-side environment variables
   * These are only available on the server
   */
  server: {
    // Node Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url().optional(),

    // Authentication
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM_ADDRESS: z.string().email().optional(),
    EMAIL_FROM_NAME: z.string().optional(),

    // Cron Jobs
    CRON_SECRET: z.string().optional(),

    // OAuth Providers (all optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),

    // Google AI
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

    // CI/CD
    CI: z.string().optional(),

    // Deployment (Vercel auto-sets this)
    VERCEL_URL: z.string().optional(),

    // Next.js Runtime (internal)
    NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
  },

  /**
   * Client-side environment variables
   * These are exposed to the browser (must be prefixed with NEXT_PUBLIC_)
   */
  client: {
    NEXT_PUBLIC_LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .default("info"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(), // Legacy - use NEXT_PUBLIC_BASE_URL
    NEXT_PUBLIC_SITE_VARIANT: z
      .enum(SITE_VARIANTS)
      .default(DEFAULT_VARIANT),
    NEXT_PUBLIC_USERNAME: z.string().optional(),
    // Legacy flag - kept for backward compatibility
    NEXT_PUBLIC_501C4: z.string().optional(),
  },

  /**
   * Runtime environment variable mapping
   * You can't destructure process.env due to Next.js limitations
   */
  runtimeEnv: {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    CRON_SECRET: process.env.CRON_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    CI: process.env.CI,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,

    // Client
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_VARIANT: process.env.NEXT_PUBLIC_SITE_VARIANT,
    NEXT_PUBLIC_USERNAME: process.env.NEXT_PUBLIC_USERNAME,
    NEXT_PUBLIC_501C4: process.env.NEXT_PUBLIC_501C4,
  },

  /**
   * Skip validation during build or in tests
   * Set SKIP_ENV_VALIDATION=true to skip
   * Also skip in Vitest environment
   */
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.NODE_ENV === "test" ||
    !!process.env.VITEST,

  /**
   * Makes it easier to debug validation errors during development
   */
  emptyStringAsUndefined: true,

  /**
   * Allow server-side env vars in test environment
   * This prevents "Attempted to access server-side env var on client" errors in Vitest
   */
  isServer: typeof window === "undefined" || !!process.env.VITEST,
})
