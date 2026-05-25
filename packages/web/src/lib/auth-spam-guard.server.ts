import type { SendVerificationRequestParams } from "next-auth/providers/email";
import { sendMagicLinkEmail } from "@/lib/email/magic-link-email";
import { prisma } from "@/lib/prisma";

const HONEYPOT_MAX_LENGTH = 500;
const MAGIC_LINK_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const MAGIC_LINK_RECENT_EMAIL_LIMIT = 5;
const DIRECT_SIGNUP_GLOBAL_WINDOW_MS = 10 * 60 * 1000;
const DIRECT_SIGNUP_GLOBAL_LIMIT = 500;

type JsonObject = Record<string, unknown>;

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

export async function shouldSuppressMagicLinkEmail(
  identifier: string,
  now = new Date(),
) {
  const email = identifier.trim().toLowerCase();
  if (!email) return true;

  const cutoff = new Date(now.getTime() - MAGIC_LINK_EMAIL_WINDOW_MS);
  try {
    const recentTokenCount = await prisma.verificationToken.count({
      where: {
        createdAt: { gte: cutoff },
        deletedAt: null,
        identifier: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // NextAuth has already minted the current token by the time it asks us
    // to send the email, so allow the first N tokens and suppress N+1.
    return recentTokenCount > MAGIC_LINK_RECENT_EMAIL_LIMIT;
  } catch (error) {
    console.error("[AUTH SPAM] Failed to check magic-link rate limit", error);
    return false;
  }
}

export async function sendSpamGuardedMagicLinkEmail(
  params: SendVerificationRequestParams,
) {
  const email = params.identifier.trim().toLowerCase();
  if (await shouldSuppressMagicLinkEmail(email)) {
    return;
  }

  return sendMagicLinkEmail({
    ...params,
    identifier: email,
  });
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
