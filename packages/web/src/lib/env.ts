/**
 * Validated, typed environment variables.
 *
 * Import this module instead of reading `process.env` directly.
 * Next.js loads env from `packages/web/.env`, which `ensure-env` recreates
 * from the monorepo root `.env` before local web commands run. Zod then
 * validates every variable listed here. Missing required vars
 * cause a hard crash at startup with a clear message.
 *
 * Client-side code can only access the `clientEnv` export (NEXT_PUBLIC_*).
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const blankToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalNonEmptyString = z.preprocess(
  blankToUndefined,
  z.string().trim().min(1).optional(),
);

const optionalUrl = z.preprocess(
  blankToUndefined,
  z.string().trim().url().optional(),
);

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Auth ──────────────────────────────────────────────────────────
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  // ── Database ──────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // ── Email ─────────────────────────────────────────────────────────
  EMAIL_FROM: z.string().optional(),
  EMAIL_MONITOR_BCC: optionalNonEmptyString,
  RESEND_API_KEY: z.string().optional(),
  RESEND_MOCK_SEND: z.enum(["1"]).optional(),
  /// Signing secret for the Resend webhook. Configured in Resend dashboard
  /// under "Webhooks" and pasted here. Required only if webhooks are wired.
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  /// Domain used for the reply-to-comment email routing. Inbound MX records
  /// must point to this domain. Defaults to `updates.warondisease.org`.
  REPLY_EMAIL_DOMAIN: optionalNonEmptyString,

  // ── Google OAuth ──────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── Google Generative AI ──────────────────────────────────────────
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GEMINI_FILE_SEARCH_STORE_ID: z.string().optional(),

  // ── World ID ──────────────────────────────────────────────────────
  WORLD_ID_APP_ID: z.string().optional(),
  WORLD_ID_RP_ID: z.string().optional(),
  WORLD_ID_SIGNING_KEY: z.string().optional(),
  WORLD_ID_ENVIRONMENT: z.enum(["production", "staging"]).optional(),
  WORLD_ID_ACTION: z.string().optional(),
  WORLD_ID_ALLOW_LEGACY_PROOFS: z.string().optional(),
  WORLD_ID_REQUEST_TTL_SECONDS: z.string().optional(),

  // ── Blockchain / Contracts ────────────────────────────────────────
  BASE_SEPOLIA_RPC_URL: z.string().optional(),
  BASE_RPC_URL: z.string().optional(),
  SEPOLIA_RPC_URL: z.string().optional(),
  EOP_MINTER_PRIVATE_KEY: z.string().optional(),
  EOP_CHAIN_ID: z.string().optional(),
  TREASURY_CHAIN_ID: z.string().optional(),
  TREASURY_OWNER_PRIVATE_KEY: z.string().optional(),
  TREASURY_RPC_URL: z.string().optional(),
  WISHOCRATIC_TREASURY_ADDRESS: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),

  // ── Push notifications ────────────────────────────────────────────
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // ── AT Protocol ───────────────────────────────────────────────────
  ATPROTO_DID: z.string().optional(),
  ATPROTO_PASSWORD: z.string().optional(),
  ATPROTO_PDS_URL: z.string().optional(),

  // ── IPFS storage ─────────────────────────────────────────────────
  IPFS_STORAGE_PROVIDER: z.enum(["storacha", "pinata"]).optional(),
  PINATA_JWT: z.string().optional(),
  PINATA_GATEWAY: z.string().optional(),
  STORACHA_KEY: z.string().optional(),
  STORACHA_PROOF: z.string().optional(),

  // ── Cron / misc ───────────────────────────────────────────────────
  CRON_SECRET: z.string().optional(),
  PUSH_BATCH_SIZE: z.string().optional(),
  REFERRAL_EMAIL_BATCH_SIZE: z.string().optional(),
  WISHOCRACY_JURISDICTION_KEY: z.string().optional(),

  // ── Stripe (donations to IAM 501(c)(3)) ───────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ── Shirt commerce spike (CustomCat sandbox by default) ───────────
  // Catalog data (product ID, variant SKUs, FMV, tax code) lives in
  // packages/db/src/managed-data/managed-commerce-catalog.ts — env is
  // only for credentials + per-environment toggles.
  SHIRT_COMMERCE_ENABLED: z.enum(["0", "1", "false", "true"]).optional(),
  CUSTOMCAT_API_TOKEN: z.string().optional(),
  CUSTOMCAT_SANDBOX: z.enum(["0", "1"]).optional(),

  // ── Cloudflare R2 (object storage for memorial photos + evidence) ─
  // Required for the memorial photo + evidence upload flow (PRD F1/F4).
  // The runtime presign route reads these to issue PUT URLs scoped to the
  // bucket; the bucket's public hostname is served from R2_PUBLIC_URL.
  // For dev-only media uploads (legacy), see also CLOUDFLARE_TOKEN above.
  R2_ENDPOINT: optionalUrl,
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: optionalUrl,
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_DEMO_LOGIN_ENABLED: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ENV: z.string().optional(),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_WORLD_ID_ENABLED: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID: optionalNonEmptyString,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/* ------------------------------------------------------------------ */
/*  Validation (lazy — runs on first access, after dotenv has loaded)  */
/* ------------------------------------------------------------------ */

let _serverEnv: ServerEnv | undefined;
let _clientEnv: ClientEnv | undefined;

/**
 * Validated server env — import only in server code.
 * Lazily validated on first access so dotenv has time to load.
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("Invalid server environment variables:", formatted);
    throw new Error(
      `Missing or invalid server environment variables:\n${Object.entries(
        formatted,
      )
        .map(([k, v]) => `  ${k}: ${(v ?? []).join(", ")}`)
        .join("\n")}`,
    );
  }

  _serverEnv = parsed.data;
  return _serverEnv;
}

/** Validated client env — safe to import anywhere. */
export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;

  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_DEMO_LOGIN_ENABLED: process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_WORLD_ID_ENABLED: process.env.NEXT_PUBLIC_WORLD_ID_ENABLED,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID:
      process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID,
  });
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("Invalid client environment variables:", formatted);
    throw new Error(
      `Missing or invalid client environment variables:\n${Object.entries(
        formatted,
      )
        .map(([k, v]) => `  ${k}: ${(v ?? []).join(", ")}`)
        .join("\n")}`,
    );
  }

  _clientEnv = parsed.data;
  return _clientEnv;
}

/**
 * Proxy that lazily validates on first property access.
 * Usage: `serverEnv.DATABASE_URL` (reads like a plain object).
 */
export const serverEnv: ServerEnv =
  typeof window === "undefined"
    ? new Proxy({} as ServerEnv, {
        get(_target, prop: string) {
          return getServerEnv()[prop as keyof ServerEnv];
        },
      })
    : (undefined as never);

export const clientEnv: ClientEnv = new Proxy({} as ClientEnv, {
  get(_target, prop: string) {
    return getClientEnv()[prop as keyof ClientEnv];
  },
});
