import { NextResponse } from "next/server"
import { prisma } from "./prisma"
import { hashPassword } from "./auth"
import { nanoid } from "nanoid"
import { createLogger } from "./logger"

export type PasswordSignupOptions = {
  /** Welcome notification title */
  welcomeTitle: string
  /** Welcome notification body */
  welcomeMessage: string
  /** Link on the welcome notification (default /dashboard) */
  welcomeLink?: string
  /**
   * If true, set emailVerified on create (legacy DIH/wishocracy path).
   * Prefer false — magic-link proves ownership.
   */
  markEmailVerified?: boolean
}

/**
 * Shared password signup POST handler for brand apps.
 */
export function createPasswordSignupHandler(options: PasswordSignupOptions) {
  const log = createLogger("auth-signup")
  const welcomeLink = options.welcomeLink ?? "/dashboard"

  return async function POST(req: Request) {
    try {
      const { email, password, name } = await req.json()

      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 },
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 })
      }

      const hashedPassword = await hashPassword(password)
      const referralCode = nanoid(8).toUpperCase()

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          referralCode,
          ...(options.markEmailVerified ? { emailVerified: new Date() } : {}),
        },
      })

      const { ensurePersonForUser } = await import("./person.server")
      await ensurePersonForUser(user.id, {
        displayName: name || email.split("@")[0],
      })

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM_ANNOUNCEMENT",
          title: options.welcomeTitle,
          message: options.welcomeMessage,
          link: welcomeLink,
        },
      })

      return NextResponse.json(
        { message: "User created successfully", userId: user.id },
        { status: 201 },
      )
    } catch (error) {
      log.error("Signup error", { error })
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }
  }
}
