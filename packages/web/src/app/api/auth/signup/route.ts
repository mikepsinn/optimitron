import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { readVercelGeo } from "@/lib/geo/vercel-geo";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { recordReferralAttributionForUser } from "@/lib/referral.server";
import { createUniqueReferralCode, createUniqueUsername } from "@/lib/user-identity.server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || null;
    const referralCode = String(body.referralCode || "").trim() || null;
    const shareAttemptId = String(body.shareAttemptId || "").trim() || null;
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
    const username = await createUniqueUsername();
    const generatedReferralCode = await createUniqueReferralCode();
    const geo = readVercelGeo(req.headers);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
        referralCode: generatedReferralCode,
        newsletterSubscribed,
        ...(geo.countryCode ? { countryCode: geo.countryCode } : {}),
        ...(geo.regionCode ? { regionCode: geo.regionCode } : {}),
        ...(geo.city ? { city: geo.city } : {}),
        ...(geo.latitude != null ? { latitude: geo.latitude } : {}),
        ...(geo.longitude != null ? { longitude: geo.longitude } : {}),
        ...(geo.timeZone ? { timeZone: geo.timeZone } : {}),
      },
    });

    await ensurePersonForUser(user.id);

    await recordReferralAttributionForUser(user.id, referralCode, shareAttemptId);

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
