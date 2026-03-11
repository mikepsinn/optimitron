import { NextResponse } from "next/server";
import { VoteAnswer } from "@prisma/client";
import { nanoid } from "nanoid";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server";
import { slugify } from "@/lib/slugify";

async function createUniqueUsername(baseInput: string) {
  const base = slugify(baseInput) || "user";
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function createUniqueReferralCode() {
  let referralCode = nanoid(8).toUpperCase();

  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = nanoid(8).toUpperCase();
  }

  return referralCode;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || null;
    const referralCode = String(body.referralCode || "").trim() || null;
    const newsletterSubscribed =
      typeof body.newsletterSubscribed === "boolean" ? body.newsletterSubscribed : true;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const username = await createUniqueUsername(name || email.split("@")[0]);
    const generatedReferralCode = await createUniqueReferralCode();
    const referrer = await findUserByUsernameOrReferralCode(referralCode);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
        referralCode: generatedReferralCode,
        newsletterSubscribed,
      },
    });

    if (referrer?.id && referrer.id !== user.id) {
      await prisma.vote.create({
        data: {
          userId: user.id,
          answer: VoteAnswer.YES,
          referredByUserId: referrer.id,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
