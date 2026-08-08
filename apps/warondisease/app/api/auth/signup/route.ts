import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { nanoid } from "nanoid"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate referral code
    const referralCode = nanoid(8).toUpperCase()

    // Create user (display name lives on Person)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        referralCode,
        emailVerified: new Date(), // Mark email as verified immediately for credentials signup
      },
    })

    const { ensurePersonForUser } = await import("@/lib/person.server")
    await ensurePersonForUser(user.id, {
      displayName: name || email.split("@")[0],
    })

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Welcome to the War on Disease!",
        message: "Your account has been created. Share your referral link to start saving lives.",
        link: "/dashboard",
      },
    })

    return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
