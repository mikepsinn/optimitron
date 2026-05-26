import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { headers } from "next/headers";
import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";
import { prisma } from "@/lib/prisma";

const HONEYPOT_MAX_LENGTH = 500;
const MAGIC_LINK_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const MAGIC_LINK_RECENT_EMAIL_LIMIT = 5;
const DIRECT_SIGNUP_GLOBAL_WINDOW_MS = 10 * 60 * 1000;
const DIRECT_SIGNUP_GLOBAL_LIMIT = 500;

type JsonObject = Record<string, unknown>;

interface MagicLinkRequestContext {
  authCallbackHost: string | null;
  emailDomain: string | null;
  refererHost: string | null;
  refererPath: string | null;
  requestCountry: string | null;
  requestId: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

export function isAuthHoneypotFilled(body: unknown) {
  const parsed = asObject(body);
  if (!parsed) return false;

  const nestedAntiSpam = asObject(parsed.antiSpam);
  return Boolean(
    clean(parsed.companyWebsite, HONEYPOT_MAX_LENGTH) ||
    clean(parsed.website, HONEYPOT_MAX_LENGTH) ||
    clean(nestedAntiSpam?.honeypot, HONEYPOT_MAX_LENGTH),
  );
}

function emailDomain(identifier: string) {
  const atIndex = identifier.lastIndexOf("@");
  if (atIndex < 0 || atIndex === identifier.length - 1) return null;
  return identifier.slice(atIndex + 1).toLowerCase();
}

function cleanHeader(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function parseUrlPart(raw: string | null | undefined, part: "host" | "path") {
  const value = cleanHeader(raw);
  if (!value) return null;
  try {
    const url = new URL(value);
    return part === "host" ? url.host : url.pathname || "/";
  } catch {
    return null;
  }
}

async function readRequestHeaders() {
  try {
    return await headers();
  } catch {
    return null;
  }
}

async function buildMagicLinkRequestContext(
  identifier: string,
  callbackUrl: string,
): Promise<MagicLinkRequestContext> {
  const requestHeaders = await readRequestHeaders();
  const referer = requestHeaders?.get("referer");
  const rawCountry = cleanHeader(requestHeaders?.get("x-vercel-ip-country"));
  const requestCountry =
    rawCountry && !["T1", "XX"].includes(rawCountry.toUpperCase())
      ? rawCountry.toUpperCase()
      : null;

  return {
    authCallbackHost: parseUrlPart(callbackUrl, "host"),
    emailDomain: emailDomain(identifier),
    refererHost: parseUrlPart(referer, "host"),
    refererPath: parseUrlPart(referer, "path"),
    requestCountry,
    requestId: cleanHeader(requestHeaders?.get("x-vercel-id")),
    secFetchMode: cleanHeader(requestHeaders?.get("sec-fetch-mode")),
    secFetchSite: cleanHeader(requestHeaders?.get("sec-fetch-site")),
  };
}

function logMagicLinkRequest(
  input: MagicLinkRequestContext & {
    existingUser?: boolean | null;
    outcome: "sent" | "suppressed" | "failed";
    providerMessageId?: string | null;
    reason?: string;
    recentTokenCount?: number | null;
  },
) {
  console.log(
    JSON.stringify({
      level: "info",
      msg: "auth_magic_link_request",
      route: "/api/auth/signin/email",
      ...input,
    }),
  );
}

async function countRecentMagicLinkTokens(
  identifier: string,
  now = new Date(),
) {
  const email = identifier.trim().toLowerCase();
  if (!email) return null;

  const cutoff = new Date(now.getTime() - MAGIC_LINK_EMAIL_WINDOW_MS);
  try {
    return await prisma.verificationToken.count({
      where: {
        createdAt: { gte: cutoff },
        deletedAt: null,
        identifier: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
  } catch (error) {
    console.error("[AUTH SPAM] Failed to check magic-link rate limit", error);
    return null;
  }
}

export async function shouldSuppressMagicLinkEmail(
  identifier: string,
  now = new Date(),
) {
  const recentTokenCount = await countRecentMagicLinkTokens(identifier, now);
  if (recentTokenCount == null) return false;

  // NextAuth has already minted the current token by the time it asks us
  // to send the email, so allow the first N tokens and suppress N+1.
  return recentTokenCount > MAGIC_LINK_RECENT_EMAIL_LIMIT;
}

export async function sendSpamGuardedMagicLinkEmail(
  params: SendVerificationRequestParams,
) {
  const email = params.identifier.trim().toLowerCase();
  const context = await buildMagicLinkRequestContext(email, params.url);
  const recentTokenCount = await countRecentMagicLinkTokens(email);
  if (
    recentTokenCount != null &&
    recentTokenCount > MAGIC_LINK_RECENT_EMAIL_LIMIT
  ) {
    logMagicLinkRequest({
      ...context,
      outcome: "suppressed",
      reason: "repeated_email",
      recentTokenCount,
    });
    return;
  }

  try {
    const result = await sendMagicLinkEmail({
      ...params,
      identifier: email,
    });

    logMagicLinkRequest({
      ...context,
      existingUser: result?.existingUser ?? null,
      outcome: "sent",
      providerMessageId: result?.providerMessageId ?? null,
      recentTokenCount,
    });
  } catch (error) {
    logMagicLinkRequest({
      ...context,
      outcome: "failed",
      reason: error instanceof Error ? error.message : "unknown",
      recentTokenCount,
    });
    throw error;
  }
}

export async function shouldSuppressDirectPasswordSignup(now = new Date()) {
  const cutoff = new Date(now.getTime() - DIRECT_SIGNUP_GLOBAL_WINDOW_MS);
  try {
    const recentUserCount = await prisma.user.count({
      where: {
        createdAt: { gte: cutoff },
        deletedAt: null,
        password: { not: null },
      },
    });

    return recentUserCount >= DIRECT_SIGNUP_GLOBAL_LIMIT;
  } catch (error) {
    console.error(
      "[AUTH SPAM] Failed to check direct signup rate limit",
      error,
    );
    return false;
  }
}
