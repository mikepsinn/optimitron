import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export function getUserHandleSeed(name: string | null | undefined, email: string) {
  return slugify(name || email.split("@")[0]) || "user";
}

export async function createUniqueUsername(baseInput: string) {
  const base = slugify(baseInput) || "user";
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function createUniqueReferralCode() {
  let referralCode = nanoid(8).toUpperCase();

  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = nanoid(8).toUpperCase();
  }

  return referralCode;
}
